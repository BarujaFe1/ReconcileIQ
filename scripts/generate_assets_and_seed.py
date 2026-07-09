"""Generate demo seed CSVs and placeholder PNG assets for ReconcileIQ."""

from __future__ import annotations

import csv
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed"
ASSETS = ROOT / "assets"
SHOTS = ASSETS / "screenshots"


def write_seed_csvs() -> None:
    SEED.mkdir(parents=True, exist_ok=True)

    orders = [
        ["order_id", "external_ref", "customer_name", "channel", "order_date", "gross_amount", "currency", "status"],
        ["ORD-1001", "MP-77821", "Ana Souza", "marketplace", "2026-06-01", "250.00", "BRL", "paid"],
        ["ORD-1002", "MP-77822", "Bruno Lima", "marketplace", "2026-06-01", "180.50", "BRL", "paid"],
        ["ORD-1003", "ST-99011", "Carla Mendes", "ecommerce", "2026-06-02", "420.00", "BRL", "paid"],
        ["ORD-1004", "ST-99012", "Diego Alves", "ecommerce", "2026-06-02", "95.00", "BRL", "paid"],
        ["ORD-1005", "DL-44100", "Elena Rocha", "delivery", "2026-06-03", "67.90", "BRL", "paid"],
        ["ORD-1006", "DL-44101", "Felipe Baruja", "delivery", "2026-06-03", "112.40", "BRL", "paid"],
        ["ORD-1007", "MP-77830", "Gabriela Nunes", "marketplace", "2026-06-04", "310.00", "BRL", "paid"],
        ["ORD-1008", "ST-99020", "Hugo Martins", "ecommerce", "2026-06-04", "540.00", "BRL", "paid"],
        ["ORD-1009", "MP-77840", "Isabela Freitas", "marketplace", "2026-06-05", "75.00", "BRL", "paid"],
        ["ORD-1010", "DL-44110", "Joao Pedro Silva", "delivery", "2026-06-05", "148.20", "BRL", "paid"],
        ["ORD-1011", "MP-77850", "Karina Lopes", "marketplace", "2026-06-06", "199.90", "BRL", "paid"],
        ["ORD-1012", "ST-99030", "Lucas Ferreira", "ecommerce", "2026-06-06", "88.00", "BRL", "open"],
    ]

    payments = [
        ["payment_id", "order_ref", "payer_name", "provider", "paid_at", "net_amount", "fee_amount", "currency", "status"],
        ["PAY-9001", "MP-77821", "Ana Souza", "mercadopago", "2026-06-01T14:10:00Z", "237.50", "12.50", "BRL", "settled"],
        ["PAY-9002", "MP-77822", "Bruno Lima", "mercadopago", "2026-06-01T15:02:00Z", "171.48", "9.02", "BRL", "settled"],
        ["PAY-9003", "ST-99011", "Carla Mendes", "stripe", "2026-06-02T11:20:00Z", "399.00", "21.00", "BRL", "settled"],
        ["PAY-9004", "ST-99012", "Diego Alves", "stripe", "2026-06-02T16:45:00Z", "90.25", "4.75", "BRL", "settled"],
        ["PAY-9005", "DL-44100", "Elena Rocha", "delivery_wallet", "2026-06-03T19:01:00Z", "64.50", "3.40", "BRL", "settled"],
        ["PAY-9006", "DL-44101", "Felipe A. Baruja", "delivery_wallet", "2026-06-03T20:12:00Z", "106.78", "5.62", "BRL", "settled"],
        ["PAY-9007", "MP-77830", "Gabriela Nunes", "mercadopago", "2026-06-04T09:30:00Z", "279.00", "15.50", "BRL", "settled"],
        ["PAY-9008", "ST-99020", "Hugo Martins", "stripe", "2026-06-04T13:18:00Z", "502.20", "27.00", "BRL", "settled"],
        ["PAY-9009", "MP-7784O", "Isabela Freitas", "mercadopago", "2026-06-05T10:05:00Z", "71.25", "3.75", "BRL", "settled"],
        ["PAY-9010", "DL-44110", "João Pedro Silva", "delivery_wallet", "2026-06-05T21:40:00Z", "140.79", "7.41", "BRL", "settled"],
        ["PAY-9011", "MP-77850", "Karina Lopes", "mercadopago", "2026-06-06T08:55:00Z", "170.00", "9.99", "BRL", "settled"],
        ["PAY-9012", "ORPHAN-01", "Marina Costa", "stripe", "2026-06-06T17:22:00Z", "130.00", "6.50", "BRL", "settled"],
    ]

    fees = [
        ["fee_id", "payment_ref", "fee_type", "expected_rate", "charged_amount", "currency"],
        ["FEE-1", "PAY-9001", "marketplace_commission", "0.05", "12.50", "BRL"],
        ["FEE-2", "PAY-9002", "marketplace_commission", "0.05", "9.02", "BRL"],
        ["FEE-3", "PAY-9003", "card_processing", "0.05", "21.00", "BRL"],
        ["FEE-4", "PAY-9004", "card_processing", "0.05", "4.75", "BRL"],
        ["FEE-5", "PAY-9005", "delivery_fee", "0.05", "3.40", "BRL"],
        ["FEE-6", "PAY-9006", "delivery_fee", "0.05", "5.62", "BRL"],
        ["FEE-7", "PAY-9007", "marketplace_commission", "0.05", "31.00", "BRL"],
        ["FEE-8", "PAY-9008", "card_processing", "0.05", "37.80", "BRL"],
        ["FEE-9", "PAY-9009", "marketplace_commission", "0.05", "3.75", "BRL"],
        ["FEE-10", "PAY-9010", "delivery_fee", "0.05", "7.41", "BRL"],
        ["FEE-11", "PAY-9011", "marketplace_commission", "0.05", "9.99", "BRL"],
    ]

    for name, rows in (
        ("orders_demo.csv", orders),
        ("payments_demo.csv", payments),
        ("fees_demo.csv", fees),
    ):
        with (SEED / name).open("w", encoding="utf-8", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerows(rows)
        print("wrote", name, "rows", len(rows) - 1)


def png(path: Path, w: int, h: int, paint) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            r, g, b = paint(x, y, w, h)
            raw.extend((r & 255, g & 255, b & 255))
    data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def lerp(a: float, b: float, t: float) -> int:
    return int(a + (b - a) * t)


def clamp(v: float, lo: int = 0, hi: int = 255) -> int:
    return max(lo, min(hi, int(v)))


def icon_paint(x: int, y: int, w: int, h: int):
    cx, cy = w / 2, h / 2
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    t = min(dist / (w * 0.62), 1.0)
    r = lerp(12, 28, t)
    g = lerp(36, 90, 1 - t)
    b = lerp(58, 120, 1 - t)
    # Linked ledger bars
    for i, bh in enumerate((0.42, 0.58, 0.48, 0.70)):
        bx0 = int(w * (0.26 + i * 0.11))
        bx1 = bx0 + int(w * 0.07)
        by1 = int(h * 0.72)
        by0 = int(by1 - h * bh)
        if bx0 <= x <= bx1 and by0 <= y <= by1:
            return (120, 210, 190)
    # Bridge link
    if abs(y - int(h * 0.42)) < 4 and int(w * 0.28) < x < int(w * 0.72):
        return (180, 240, 220)
    if 200 < dist < 220:
        return (160, 230, 210)
    return (r, g, b)


def hero_paint(x: int, y: int, w: int, h: int):
    t = x / w
    r = lerp(8, 20, t)
    g = lerp(24, 64, y / h)
    b = lerp(42, 96, t)
    left = int(w * 0.18)
    right = int(w * 0.82)
    mid = int(h * 0.5)
    if left < x < left + 220 and 120 < y < h - 120:
        return (clamp(r + 12), clamp(g + 40), clamp(b + 35))
    if right - 220 < x < right and 120 < y < h - 120:
        return (clamp(r + 18), clamp(g + 28), clamp(b + 45))
    # Connection curves between panels
    curve = mid + int(40 * math.sin(x / 70.0))
    if abs(y - curve) < 3 and left + 200 < x < right - 200:
        return (140, 235, 210)
    if x % 90 == 0 or y % 70 == 0:
        return (clamp(r + 8), clamp(g + 14), clamp(b + 20))
    return (r, g, b)


def arch_paint(x: int, y: int, w: int, h: int):
    r, g, b = 10, 22, 36
    boxes = [
        (0.04, 0.34, 0.14, 0.32),
        (0.22, 0.34, 0.14, 0.32),
        (0.40, 0.34, 0.14, 0.32),
        (0.58, 0.34, 0.14, 0.32),
        (0.76, 0.34, 0.18, 0.32),
    ]
    for bx, by, bw, bh in boxes:
        x0, x1 = int(bx * w), int((bx + bw) * w)
        y0, y1 = int(by * h), int((by + bh) * h)
        if x0 <= x <= x1 and y0 <= y <= y1:
            if x0 + 3 <= x <= x1 - 3 and y0 + 3 <= y <= y1 - 3:
                return (16, 62, 78)
            return (90, 205, 175)
    if int(h * 0.48) <= y <= int(h * 0.52):
        for edge in (0.18, 0.36, 0.54, 0.72):
            if int(edge * w) <= x <= int((edge + 0.04) * w):
                return (140, 230, 200)
    return (r, g, b)


def social_paint(x: int, y: int, w: int, h: int):
    t = x / w
    r = lerp(8, 24, t)
    g = lerp(30, 80, y / h)
    b = lerp(50, 110, t)
    if abs(y - int(h * 0.55) + int(24 * math.sin(x / 45.0))) < 16:
        return (100, 215, 185)
    if x < 90:
        return (14, 48, 66)
    return (r, g, b)


def make_shot(name: str, base: tuple[int, int, int]) -> None:
    br, bg, bb = base

    def paint(x: int, y: int, w: int, h: int):
        r = br + (x * 18) // w
        g = bg + (y * 28) // h
        b = bb + ((x + y) * 12) // (w + h)
        if y < 48:
            return (clamp(r + 10), clamp(g + 18), clamp(b + 22))
        # Dual pane workbench
        if 80 < y < 520:
            if 40 < x < int(w * 0.46):
                return (clamp(r + 20), clamp(g + 40), clamp(b + 30))
            if int(w * 0.54) < x < w - 40:
                return (clamp(r + 14), clamp(g + 28), clamp(b + 40))
            if abs(y - (260 + int(20 * math.sin(x / 30.0)))) < 2:
                return (150, 235, 210)
        if 560 < y < 780 and 40 < x < w - 40:
            return (clamp(r + 10), clamp(g + 22), clamp(b + 18))
        return (clamp(r), clamp(g), clamp(b))

    png(SHOTS / name, 1400, 860, paint)


def main() -> None:
    write_seed_csvs()
    png(ASSETS / "icon.png", 512, 512, icon_paint)
    png(ASSETS / "hero-cover.png", 1600, 900, hero_paint)
    png(ASSETS / "architecture-pipeline.png", 1400, 700, arch_paint)
    png(ASSETS / "social-preview.png", 1280, 640, social_paint)
    shots = [
        ("01-matching-workbench.png", (12, 38, 58)),
        ("02-exception-inbox.png", (14, 44, 66)),
        ("03-confidence-score.png", (16, 50, 72)),
        ("04-diff-viewer.png", (10, 34, 56)),
        ("05-financial-leakage-board.png", (18, 56, 78)),
        ("06-audit-trail.png", (12, 42, 64)),
        ("07-monthly-close.png", (20, 48, 70)),
        ("08-executive-memo.png", (15, 40, 62)),
    ]
    for name, base in shots:
        make_shot(name, base)
        print("shot", name)
    print("assets ready")


if __name__ == "__main__":
    main()
