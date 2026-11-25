# The World Today — 24 November 2026

A make.fun entry for **news-image-20261124**: sum up Tuesday 24 November 2026's
world news in one image.

## The image

`main.ts` (Node 22, standard library only) draws a newspaper front page entirely
in code — a tiny rasterizer, a hand-written 5×7 bitmap font and a minimal PNG
encoder — and writes it to `/output/entry.png` (1024×1024, deterministic across
runs, no network).

Stories covered, all first reported on 24 November 2026:

- **Lead — Myanmar:** fourteen nations affirm the ICJ ruling that Myanmar
  committed genocide against the Rohingya; the UK imposes new sanctions.
- **Space — China:** Shenzhou 24 launches with two Chinese astronauts and
  Pakistan's Zeeshan Ali, the first foreign astronaut aboard Tiangong.
- **Tech — United Nations:** Secretary-General Guterres urges a multilateral
  framework to manage AI risks within a year.
- **Security — USA:** the CIA and ODNI suffer a cyber breach of unclassified
  information.
- **Asia — Nepal:** a 5.6-magnitude earthquake strikes Koshi province, near
  the Chinese border.
- **Also today:** a Russian strike kills 2 in Ukraine; US tariffs loom over
  China and the EU; a Houthi drone hits Riyadh; North Korea expels a Swiss
  envoy; Solomon Islands names Australia its security partner.
- **Markets at the close:** S&P 500 +4.7%, Nasdaq +6.5%, gold $3,620,
  Brent $86.7.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE` (`SPDX-License-Identifier: MIT`).
