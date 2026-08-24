"""Minimal stdlib-only PNG decode/crop/encode (no Pillow available)."""
import struct
import zlib


def _read_chunks(data):
    pos = 8
    chunks = []
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        ctype = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        chunks.append((ctype, chunk))
        pos += 8 + length + 4
    return chunks


def _paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def decode_png_rgb(path):
    """Returns (width, height, bytearray of raw RGB rows concatenated, no filter)."""
    data = open(path, "rb").read()
    chunks = _read_chunks(data)
    width = height = bitdepth = colortype = None
    idat = b""
    for ctype, chunk in chunks:
        if ctype == b"IHDR":
            width, height, bitdepth, colortype, comp, filt, interlace = struct.unpack(">IIBBBBB", chunk[:13])
        elif ctype == b"IDAT":
            idat += chunk
    assert bitdepth == 8, f"unsupported bitdepth {bitdepth}"
    assert colortype in (2, 6), f"unsupported colortype {colortype}"
    bpp = 3 if colortype == 2 else 4
    raw = zlib.decompress(idat)
    stride = width * bpp
    out = bytearray(height * width * 3)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        ftype = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ftype == 0:
            pass
        elif ftype == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ftype == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + _paeth(a, b, c)) & 0xFF
        else:
            raise ValueError(f"bad filter {ftype}")
        # write RGB (drop alpha if present) into out
        row_off = y * width * 3
        if bpp == 3:
            out[row_off:row_off + stride] = line
        else:
            for x in range(width):
                out[row_off + x * 3:row_off + x * 3 + 3] = line[x * 4:x * 4 + 3]
        prev = line
    return width, height, out


def _chunk(ctype, data):
    return (struct.pack(">I", len(data)) + ctype + data +
            struct.pack(">I", zlib.crc32(ctype + data) & 0xFFFFFFFF))


def encode_png_rgb(path, width, height, rgb_bytes, compress_level=6):
    stride = width * 3
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type None
        raw += rgb_bytes[y * stride:(y + 1) * stride]
    idat = zlib.compress(bytes(raw), compress_level)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(_chunk(b"IHDR", ihdr))
        f.write(_chunk(b"IDAT", idat))
        f.write(_chunk(b"IEND", b""))


def crop_png(src_path, dst_path, x, y, w, h):
    width, height, rgb = decode_png_rgb(src_path)
    assert x + w <= width and y + h <= height, (x, y, w, h, width, height)
    out = bytearray(w * h * 3)
    src_stride = width * 3
    dst_stride = w * 3
    for row in range(h):
        src_off = (y + row) * src_stride + x * 3
        dst_off = row * dst_stride
        out[dst_off:dst_off + dst_stride] = rgb[src_off:src_off + dst_stride]
    encode_png_rgb(dst_path, w, h, out)
