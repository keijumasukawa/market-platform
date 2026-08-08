import { describe, expect, it } from "vitest";
import { Decimal } from "../src/decimal.ts";
import { calculateEma } from "../src/ema.ts";

function convertToDecimals(values: string[]): Decimal[] {
  return values.map((value) => new Decimal(value));
}

function convertToStrings(values: (Decimal | null)[]): (string | null)[] {
  return values.map((value) => (value === null ? null : value.toString()));
}

describe("calculateEma", () => {
  it("既知データと一致する(期間 3・平滑係数 0.5)", () => {
    const closes = convertToDecimals(["1", "2", "3", "4", "5"]);
    expect(convertToStrings(calculateEma(closes, 3))).toEqual([
      null,
      null,
      "2",
      "3",
      "4",
    ]);
  });

  it("先頭 N 本の SMA を初期値とする", () => {
    const closes = convertToDecimals(["10", "20", "60"]);
    expect(convertToStrings(calculateEma(closes, 3))).toEqual([
      null,
      null,
      "30",
    ]);
  });

  it("割り切れない平滑を小数 10 桁・ROUND_HALF_UP で丸める", () => {
    const closes = convertToDecimals(["1", "2", "4"]);
    expect(convertToStrings(calculateEma(closes, 2))).toEqual([
      null,
      "1.5",
      "3.1666666667",
    ]);
  });

  it("前回値を渡すと先頭から再帰を継続する", () => {
    const closes = convertToDecimals(["4", "5"]);
    expect(convertToStrings(calculateEma(closes, 3, new Decimal("2")))).toEqual(
      ["3", "4"],
    );
  });

  it("全期間の計算と前回値からの増分計算が一致する", () => {
    const closes = convertToDecimals(["1", "2", "4", "8", "16", "32"]);
    const period = 3;
    const wholeSeries = calculateEma(closes, period);
    const seed = wholeSeries[3];
    expect(seed).not.toBeNull();
    if (seed === null) {
      return;
    }
    const continuation = calculateEma(closes.slice(4), period, seed);
    expect(convertToStrings(continuation)).toEqual(
      convertToStrings(wholeSeries.slice(4)),
    );
  });

  it("期間に満たない系列はすべて null とする", () => {
    const closes = convertToDecimals(["1", "2"]);
    expect(convertToStrings(calculateEma(closes, 3))).toEqual([null, null]);
  });

  it("空の系列には空の結果を返す", () => {
    expect(calculateEma([], 12)).toEqual([]);
  });

  it("期間 1 は各値をそのまま返す", () => {
    const closes = convertToDecimals(["1.5", "2.5"]);
    expect(convertToStrings(calculateEma(closes, 1))).toEqual(["1.5", "2.5"]);
  });

  it("期間が 1 未満または整数でない場合は例外とする", () => {
    const closes = convertToDecimals(["1"]);
    expect(() => calculateEma(closes, 0)).toThrow();
    expect(() => calculateEma(closes, 1.5)).toThrow();
  });
});
