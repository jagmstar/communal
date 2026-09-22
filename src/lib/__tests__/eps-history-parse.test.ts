import { describe, it, expect } from "vitest";
import { decodeEntities, parseMetersHistory, parsePaymentsHistory } from "../eps-history-parse";

// Fixtures below are verbatim excerpts of the REAL response saved to
// data/eps-raw/{meters,payments}-history-raw.html on 2026-09-22 (account
// #2099000225595, view_meters_history / view_history POST endpoints — see
// docs/EPS-RECON-2026-09-18.md and scripts/eps-history-sync.mjs). Not
// synthetic: these are the actual EPS table markup and real historical
// values (earliest real row on this account: 2018-02-28).

const METERS_FIXTURE = `<table class="tablesorter rowradioselect">
    <thead>
    <tr>
        <th>Дата</th>
        <th>Час</th>
        <th>Назва каси</th>
        <th>Номер квитанції</th>
        <th>Послуга</th>
        <th>Номер лічильника</th>
        <th>Показник зі служби</th>
        <th>Показник</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>2018-02-28</td>
        <td>21:33:37</td>
        <td style="text-align:right;">EPS</td>
        <td style="text-align:right;"></td>
        <td style="text-align:right;">Вода</td>
        <td style="text-align:right;">14091126</td>
        <td style="text-align:right;">112</td>
        <td style="text-align:right;">118</td>
    </tr>
    <tr>
        <td>2018-02-28</td>
        <td>21:33:37</td>
        <td style="text-align:right;">EPS</td>
        <td style="text-align:right;"></td>
        <td style="text-align:right;">ДП Газпостач</td>
        <td style="text-align:right;">98040</td>
        <td style="text-align:right;">4785</td>
        <td style="text-align:right;">4534</td>
    </tr>
    <tr>
        <td>2018-04-01</td>
        <td>09:08:35</td>
        <td style="text-align:right;">EPS</td>
        <td style="text-align:right;"></td>
        <td style="text-align:right;">Вода</td>
        <td style="text-align:right;">14091126</td>
        <td style="text-align:right;">118</td>
        <td style="text-align:right;">125</td>
    </tr>
    </tbody>
</table>`;

const PAYMENTS_FIXTURE = `<table class="tablesorter rowradioselect">
        <thead>
        <tr>
            <th></th>
            <th>Дата</th>
            <th>Час</th>
            <th>Назва каси</th>
            <th>Номер квитанції</th>
            <th>Сума</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <input id="commit_date" name="commit_date" type="hidden" value="2018-01-16" />
            <input id="office_id" name="office_id" type="hidden" value="366" />
            <input id="serial" name="serial" type="hidden" value="4736" />
            <td><input id="id_1" name="id" type="radio" value="1" /></td>
            <td>2018-01-16</td>
            <td>14:27:22.677504</td>
            <td>ОМ Злуки 10019/08 RPC</td>
            <td style="text-align:right;">4736</td>
            <td style="text-align:right;">1252.42</td>
        </tr>
        <tr>
            <input id="commit_date" name="commit_date" type="hidden" value="2022-02-15" />
            <input id="office_id" name="office_id" type="hidden" value="471" />
            <input id="serial" name="serial" type="hidden" value="15505455" />
            <td><input id="id_195" name="id" type="radio" value="195" /></td>
            <td>2022-02-15</td>
            <td>10:07:55.719021</td>
            <td>ТОВ &#34;УПР&#34; (IPAY)</td>
            <td style="text-align:right;">15505455</td>
            <td style="text-align:right;">3839.92</td>
        </tr>
        </tbody>
</table>`;

describe("parseMetersHistory", () => {
  it("parses real EPS meter-reading rows (date, meter number, service, org reading)", () => {
    const rows = parseMetersHistory(METERS_FIXTURE);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      readingDate: "2018-02-28",
      meterNumber: "14091126",
      serviceName: "Вода",
      value: 118,
    });
    expect(rows[1].meterNumber).toBe("98040");
    expect(rows[1].value).toBe(4534);
  });

  it("returns [] when the HTML has no <tbody> (malformed/empty response)", () => {
    expect(parseMetersHistory("<html><body>no table here</body></html>")).toEqual([]);
  });

  it("skips rows with fewer than 8 cells instead of throwing", () => {
    const truncated = `<tbody><tr><td>2018-01-01</td><td>x</td></tr></tbody>`;
    expect(parseMetersHistory(truncated)).toEqual([]);
  });
});

describe("parsePaymentsHistory", () => {
  it("parses real EPS receipt rows keyed by the hidden serial input", () => {
    const rows = parsePaymentsHistory(PAYMENTS_FIXTURE);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      serial: "4736",
      officeId: "366",
      date: "2018-01-16",
      casaName: "ОМ Злуки 10019/08 RPC",
      receiptNo: "4736",
      amount: 1252.42,
    });
  });

  it("decodes &#34; HTML entities in casaName (real EPS row: ТОВ &#34;УПР&#34; (IPAY))", () => {
    const rows = parsePaymentsHistory(PAYMENTS_FIXTURE);
    expect(rows[1].casaName).toBe('ТОВ "УПР" (IPAY)');
    expect(rows[1].casaName).not.toContain("&#34;");
  });

  it("returns [] when the HTML has no <tbody>", () => {
    expect(parsePaymentsHistory("<html></html>")).toEqual([]);
  });
});

describe("decodeEntities", () => {
  it("decodes &#34;, &quot;, &amp;, &nbsp;", () => {
    expect(decodeEntities("a&#34;b")).toBe('a"b');
    expect(decodeEntities("a&quot;b")).toBe('a"b');
    expect(decodeEntities("a&amp;b")).toBe("a&b");
    expect(decodeEntities("a&nbsp;b")).toBe("a b");
  });

  it("passes through null/undefined/empty unchanged", () => {
    expect(decodeEntities(null)).toBeNull();
    expect(decodeEntities(undefined)).toBeNull();
    expect(decodeEntities("")).toBe("");
  });
});
