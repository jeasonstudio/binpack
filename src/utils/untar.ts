// Source: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
// Unmarshals an Uint8Array to string.
function decodeUTF8(bytes: any) {
  var s = '';
  var i = 0;
  while (i < bytes.length) {
    var c = bytes[i++];
    if (c > 127) {
      if (c > 191 && c < 224) {
        if (i >= bytes.length) throw 'UTF-8 decode: incomplete 2-byte sequence';
        c = ((c & 31) << 6) | (bytes[i] & 63);
      } else if (c > 223 && c < 240) {
        if (i + 1 >= bytes.length)
          throw 'UTF-8 decode: incomplete 3-byte sequence';
        c = ((c & 15) << 12) | ((bytes[i] & 63) << 6) | (bytes[++i] & 63);
      } else if (c > 239 && c < 248) {
        if (i + 2 >= bytes.length)
          throw 'UTF-8 decode: incomplete 4-byte sequence';
        c =
          ((c & 7) << 18) |
          ((bytes[i] & 63) << 12) |
          ((bytes[++i] & 63) << 6) |
          (bytes[++i] & 63);
      } else
        throw 'UTF-8 decode: unknown multibyte start 0x' +
          c.toString(16) +
          ' at index ' +
          (i - 1);
      ++i;
    }

    if (c <= 0xffff) s += String.fromCharCode(c);
    else if (c <= 0x10ffff) {
      c -= 0x10000;
      s += String.fromCharCode((c >> 10) | 0xd800);
      s += String.fromCharCode((c & 0x3ff) | 0xdc00);
    } else
      throw 'UTF-8 decode: code point 0x' +
        c.toString(16) +
        ' exceeds UTF-16 reach';
  }
  return s;
}

class TarFile {}

interface IField {
  name: any;
  value: any;
}

class PaxHeader {
  static parse(buffer: ArrayBuffer) {
    // https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.bpxa500/paxex.htm
    // An extended header shall consist of one or more records, each constructed as follows:
    // "%d %s=%s\n", <length>, <keyword>, <value>

    // The extended header records shall be encoded according to the ISO/IEC10646-1:2000 standard (UTF-8).
    // The <length> field, <blank>, equals sign, and <newline> shown shall be limited to the portable character set, as
    // encoded in UTF-8. The <keyword> and <value> fields can be any UTF-8 characters. The <length> field shall be the
    // decimal length of the extended header record in octets, including the trailing <newline>.

    let bytes = new Uint8Array(buffer);
    let fields: IField[] = [];

    while (bytes.length > 0) {
      // Decode bytes up to the first space character; that is the total field length
      let fieldLength = parseInt(
        decodeUTF8(bytes.subarray(0, bytes.indexOf(0x20))),
      );
      let fieldText = decodeUTF8(bytes.subarray(0, fieldLength));
      let fieldMatch = fieldText.match(/^\d+ ([^=]+)=(.*)\n$/);

      if (fieldMatch === null) {
        throw new Error('Invalid PAX header data format.');
      }

      let fieldName = fieldMatch[1];
      let fieldValue: any = fieldMatch[2];
      if (fieldValue.length === 0) {
        fieldValue = null;
      } else if (fieldValue.match(/^\d+$/) !== null) {
        // If it's a integer field, parse it as int
        fieldValue = parseInt(fieldValue);
      }
      // Don't parse float values since precision is lost
      let field: IField = {
        name: fieldName,
        value: fieldValue,
      };
      fields.push(field);
      bytes = bytes.subarray(fieldLength); // Cut off the parsed field data
    }

    return new PaxHeader(fields);
  }
  fields!: IField[];
  constructor(fields: IField[]) {
    this.fields = fields;
  }
  applyHeader(file: any) {
    // Apply fields to the file
    // If a field is of value null, it should be deleted from the file
    // https://www.mkssoftware.com/docs/man4/pax.4.asp

    this.fields.forEach(function(field) {
      var fieldName = field.name;
      var fieldValue = field.value;
      if (fieldName === 'path') {
        // This overrides the name and prefix fields in the following header block.
        fieldName = 'name';
        if (file.prefix !== undefined) {
          delete file.prefix;
        }
      } else if (fieldName === 'linkpath') {
        // This overrides the linkname field in the following header block.
        fieldName = 'linkname';
      }
      if (fieldValue === null) {
        delete file[fieldName];
      } else {
        file[fieldName] = fieldValue;
      }
    });
  }
}

class UntarStream {
  protected bufferView!: DataView;
  protected position = 0;
  constructor(ab: ArrayBuffer) {
    this.bufferView = new DataView(ab);
  }
  public seek(byteCount: number) {
    this.position += byteCount;
  }
  public setPosition(): number;
  public setPosition(newPosition: number): void;
  public setPosition(newPosition?: number) {
    if (newPosition === undefined) {
      return this.position;
    }
    this.position = newPosition;
    return undefined;
  }
  public peekUint32() {
    return this.bufferView.getUint32(this.setPosition(), true);
  }
  public size() {
    return this.bufferView.byteLength;
  }
  public readString(charCount: number) {
    //console.log("readString: position " + this.position() + ", " + charCount + " chars");
    const charSize = 1;
    const byteCount = charCount * charSize;
    const charCodes = [];
    for (let i = 0; i < charCount; ++i) {
      let charCode = this.bufferView.getUint8(
        this.setPosition() + i * charSize,
      );
      if (charCode !== 0) {
        charCodes.push(charCode);
      } else {
        break;
      }
    }
    this.seek(byteCount);
    return String.fromCharCode.apply(null, charCodes);
  }
  public readBuffer(byteCount: number) {
    let buf;
    if (typeof ArrayBuffer.prototype.slice === 'function') {
      buf = this.bufferView.buffer.slice(
        this.setPosition(),
        this.setPosition() + byteCount,
      );
    } else {
      buf = new ArrayBuffer(byteCount);
      let target = new Uint8Array(buf);
      let src = new Uint8Array(
        this.bufferView.buffer,
        this.setPosition(),
        byteCount,
      );
      target.set(src);
    }
    this.seek(byteCount);
    return buf;
  }
}

export class UntarFileStream {
  stream!: UntarStream;
  globalPaxHeader: PaxHeader | null = null;
  constructor(ab: ArrayBuffer) {
    this.stream = new UntarStream(ab);
  }
  public hasNext() {
    // A tar file ends with 4 zero bytes
    return (
      this.stream.setPosition() + 4 < this.stream.size() &&
      this.stream.peekUint32() !== 0
    );
  }
  public next() {
    return this.readNextFile();
  }
  public readNextFile() {
    var stream = this.stream;
    var file: any = new TarFile();
    var isHeaderFile = false;
    var paxHeader = null;

    var headerBeginPos = stream.setPosition();
    var dataBeginPos = headerBeginPos + 512;

    // Read header
    file.name = stream.readString(100);
    file.mode = stream.readString(8);
    file.uid = parseInt(stream.readString(8));
    file.gid = parseInt(stream.readString(8));
    file.size = parseInt(stream.readString(12), 8);
    file.mtime = parseInt(stream.readString(12), 8);
    file.checksum = parseInt(stream.readString(8));
    file.type = stream.readString(1);
    file.linkname = stream.readString(100);
    file.ustarFormat = stream.readString(6);

    if (file.ustarFormat.indexOf('ustar') > -1) {
      file.version = stream.readString(2);
      file.uname = stream.readString(32);
      file.gname = stream.readString(32);
      file.devmajor = parseInt(stream.readString(8));
      file.devminor = parseInt(stream.readString(8));
      file.namePrefix = stream.readString(155);
      if (file.namePrefix.length > 0) {
        file.name = file.namePrefix + '/' + file.name;
      }
    }

    stream.setPosition(dataBeginPos);

    // Derived from https://www.mkssoftware.com/docs/man4/pax.4.asp
    // and https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.bpxa500/pxarchfm.htm
    switch (file.type) {
      case '0': // Normal file is either "0" or "\0".
      case '': // In case of "\0", readString returns an empty string, that is "".
        file.buffer = stream.readBuffer(file.size);
        break;
      case '1': // Link to another file already archived
        // TODO Should we do anything with these?
        break;
      case '2': // Symbolic link
        // TODO Should we do anything with these?
        break;
      case '3': // Character special device (what does this mean??)
        break;
      case '4': // Block special device
        break;
      case '5': // Directory
        break;
      case '6': // FIFO special file
        break;
      case '7': // Reserved
        break;
      case 'g': // Global PAX header
        isHeaderFile = true;
        this.globalPaxHeader = PaxHeader.parse(stream.readBuffer(file.size));
        break;
      case 'x': // PAX header
        isHeaderFile = true;
        paxHeader = PaxHeader.parse(stream.readBuffer(file.size));
        break;
      default:
        // Unknown file type
        break;
    }

    if (file.buffer === undefined) {
      file.buffer = new ArrayBuffer(0);
    }

    var dataEndPos = dataBeginPos + file.size;

    // File data is padded to reach a 512 byte boundary; skip the padded bytes too.
    if (file.size % 512 !== 0) {
      dataEndPos += 512 - (file.size % 512);
    }

    stream.setPosition(dataEndPos);

    if (isHeaderFile) {
      file = this.readNextFile();
    }

    if (this.globalPaxHeader !== null) {
      this.globalPaxHeader.applyHeader(file);
    }

    if (paxHeader !== null) {
      paxHeader.applyHeader(file);
    }
    return file;
  }
}
