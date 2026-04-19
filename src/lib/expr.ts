// Symbolic expression engine: rationals + variable monomials.
// An Expr is a sum of Terms. Each Term has a rational coefficient and a
// product of variables raised to integer powers (e.g. 2 * x^2 * y).
// Supports +, -, *, / (when divisor is a non-zero rational or pure-variable
// monomial), unary minus, equality, parsing and stringification.
//
// Designed for matrix calculators where entries can be:
//   - integers ("3", "-7")
//   - fractions ("3/4", "-5/2")
//   - variables ("x", "alpha")
//   - simple polynomials ("2x + 1", "a/2 - b")

// ---------- Rational ----------

export type Rational = { n: bigint; d: bigint }; // d > 0

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1n;
}

export function rat(n: number | bigint, d: number | bigint = 1n): Rational {
  let nn = typeof n === "bigint" ? n : BigInt(Math.trunc(n));
  let dd = typeof d === "bigint" ? d : BigInt(Math.trunc(d));
  if (dd === 0n) throw new Error("Division by zero");
  if (dd < 0n) { nn = -nn; dd = -dd; }
  const g = gcd(nn, dd);
  return { n: nn / g, d: dd / g };
}

export const R0 = rat(0);
export const R1 = rat(1);

export function rEq(a: Rational, b: Rational) { return a.n * b.d === b.n * a.d; }
export function rIsZero(a: Rational) { return a.n === 0n; }
export function rNeg(a: Rational): Rational { return { n: -a.n, d: a.d }; }
export function rAdd(a: Rational, b: Rational): Rational { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
export function rSub(a: Rational, b: Rational): Rational { return rAdd(a, rNeg(b)); }
export function rMul(a: Rational, b: Rational): Rational { return rat(a.n * b.n, a.d * b.d); }
export function rDiv(a: Rational, b: Rational): Rational {
  if (b.n === 0n) throw new Error("Division by zero");
  return rat(a.n * b.d, a.d * b.n);
}
export function rToNumber(a: Rational): number { return Number(a.n) / Number(a.d); }
export function rToString(a: Rational): string {
  if (a.d === 1n) return a.n.toString();
  return `${a.n}/${a.d}`;
}

// ---------- Term & Expr ----------

export type VarMap = Record<string, number>; // variable -> integer power
export type Term = { c: Rational; v: VarMap };
export type Expr = { terms: Term[] }; // canonical: combined like terms, sorted, zero-coef removed

function cleanVars(v: VarMap): VarMap {
  const out: VarMap = {};
  for (const k of Object.keys(v)) if (v[k] !== 0) out[k] = v[k];
  return out;
}
function varKey(v: VarMap): string {
  return Object.keys(v).sort().map((k) => `${k}^${v[k]}`).join("*");
}
function combineVars(a: VarMap, b: VarMap): VarMap {
  const out: VarMap = { ...a };
  for (const k of Object.keys(b)) out[k] = (out[k] ?? 0) + b[k];
  return cleanVars(out);
}

export function E(...terms: Term[]): Expr {
  const map = new Map<string, Term>();
  for (const t of terms) {
    const v = cleanVars(t.v);
    const k = varKey(v);
    const cur = map.get(k);
    if (cur) cur.c = rAdd(cur.c, t.c);
    else map.set(k, { c: t.c, v });
  }
  const out: Term[] = [];
  for (const t of map.values()) if (!rIsZero(t.c)) out.push(t);
  // sort: constant first, then by variable key
  out.sort((a, b) => {
    const ka = varKey(a.v), kb = varKey(b.v);
    if (ka === "" && kb !== "") return -1;
    if (kb === "" && ka !== "") return 1;
    return ka.localeCompare(kb);
  });
  return { terms: out };
}

export const ZERO: Expr = { terms: [] };
export const ONE: Expr = E({ c: R1, v: {} });

export function fromRational(r: Rational): Expr {
  return rIsZero(r) ? ZERO : E({ c: r, v: {} });
}
export function fromInt(n: number | bigint): Expr {
  return fromRational(rat(n));
}
export function fromVar(name: string): Expr {
  return E({ c: R1, v: { [name]: 1 } });
}

export function isZero(e: Expr): boolean { return e.terms.length === 0; }
export function exprEq(a: Expr, b: Expr): boolean {
  if (a.terms.length !== b.terms.length) return false;
  for (let i = 0; i < a.terms.length; i++) {
    if (!rEq(a.terms[i].c, b.terms[i].c)) return false;
    if (varKey(a.terms[i].v) !== varKey(b.terms[i].v)) return false;
  }
  return true;
}

export function asRational(e: Expr): Rational | null {
  if (!e || !e.terms) return R0;
  if (e.terms.length === 0) return R0;
  if (e.terms.length === 1 && Object.keys(e.terms[0].v).length === 0) return e.terms[0].c;
  return null;
}
export function asNumber(e: Expr): number | null {
  const r = asRational(e);
  return r ? rToNumber(r) : null;
}
export function isConstant(e: Expr): boolean { return asRational(e) !== null; }

// ---------- Arithmetic on Expr ----------

export function neg(a: Expr): Expr { return E(...a.terms.map((t) => ({ c: rNeg(t.c), v: t.v }))); }
export function add(a: Expr, b: Expr): Expr { return E(...a.terms, ...b.terms); }
export function sub(a: Expr, b: Expr): Expr { return add(a, neg(b)); }
export function mul(a: Expr, b: Expr): Expr {
  const out: Term[] = [];
  for (const ta of a.terms) for (const tb of b.terms) {
    out.push({ c: rMul(ta.c, tb.c), v: combineVars(ta.v, tb.v) });
  }
  return E(...out);
}
export function div(a: Expr, b: Expr): Expr {
  if (isZero(b)) throw new Error("Division by zero");
  // Only divide by a single-term expr (monomial) — keeps things tractable.
  if (b.terms.length !== 1) {
    throw new Error(`Cannot divide by polynomial "${stringify(b)}"`);
  }
  const tb = b.terms[0];
  const out: Term[] = [];
  for (const ta of a.terms) {
    const newVars: VarMap = { ...ta.v };
    for (const k of Object.keys(tb.v)) newVars[k] = (newVars[k] ?? 0) - tb.v[k];
    out.push({ c: rDiv(ta.c, tb.c), v: cleanVars(newVars) });
  }
  return E(...out);
}

// Try to detect if expr is "definitely zero" symbolically.
export function isSymZero(e: Expr): boolean { return e.terms.length === 0; }

// ---------- Stringify ----------

function termString(t: Term, first: boolean): string {
  const isConst = Object.keys(t.v).length === 0;
  const neg = t.c.n < 0n;
  const absC: Rational = neg ? { n: -t.c.n, d: t.c.d } : t.c;
  const sign = first ? (neg ? "-" : "") : (neg ? " - " : " + ");

  const showCoef = isConst || !(absC.n === 1n && absC.d === 1n);
  const coefStr = showCoef ? rToString(absC) : "";
  const varStr = Object.keys(t.v).sort().map((k) => {
    const p = t.v[k];
    return p === 1 ? k : `${k}^${p}`;
  }).join("");

  let body = "";
  if (showCoef && varStr) {
    // 3/4 * x  →  use no operator between rational and var, but if coef is fraction with /,
    // wrap to avoid ambiguity: "(3/4)x"
    if (absC.d !== 1n) body = `(${coefStr})${varStr}`;
    else body = `${coefStr}${varStr}`;
  } else {
    body = coefStr || varStr;
  }
  return sign + body;
}

export function stringify(e: Expr): string {
  if (!e || !e.terms || e.terms.length === 0) return "0";
  return e.terms.map((t, i) => termString(t, i === 0)).join("");
}

// Plain-number string when possible (for narrow display columns).
export function stringifyShort(e: Expr): string {
  if (!e || !e.terms) return "0";
  const r = asRational(e);
  if (r) return rToString(r);
  return stringify(e);
}

// ---------- Parser ----------
// Grammar (informal):
//   expr    := term (('+' | '-') term)*
//   term    := factor ( ('*'|'/'|implicit) factor )*
//   factor  := '-' factor | '(' expr ')' | number | ident ('^' integer)?
//   number  := digits ('.' digits)?     (decimal becomes a rational)
//   ident   := [A-Za-z_][A-Za-z_0-9]*

export function parse(input: string): Expr {
  const src = input.trim();
  if (src === "" || src === "-") return ZERO;
  const p = new Parser(src);
  const e = p.parseExpr();
  p.skipWs();
  if (!p.eof()) throw new Error(`Unexpected "${p.rest()}"`);
  return e;
}

class Parser {
  i = 0;
  constructor(public s: string) {}
  eof() { return this.i >= this.s.length; }
  rest() { return this.s.slice(this.i); }
  peek() { return this.s[this.i]; }
  skipWs() { while (!this.eof() && /\s/.test(this.s[this.i])) this.i++; }
  match(ch: string) { this.skipWs(); if (this.s[this.i] === ch) { this.i++; return true; } return false; }

  parseExpr(): Expr {
    let left = this.parseTerm();
    while (true) {
      this.skipWs();
      const ch = this.s[this.i];
      if (ch === "+") { this.i++; left = add(left, this.parseTerm()); }
      else if (ch === "-") { this.i++; left = sub(left, this.parseTerm()); }
      else break;
    }
    return left;
  }

  parseTerm(): Expr {
    let left = this.parseFactor();
    while (true) {
      this.skipWs();
      const ch = this.s[this.i];
      if (ch === "*") { this.i++; left = mul(left, this.parseFactor()); }
      else if (ch === "/") { this.i++; left = div(left, this.parseFactor()); }
      else if (ch && /[A-Za-z_(]/.test(ch)) {
        // implicit multiplication: 2x, 3(x+1), x y
        left = mul(left, this.parseFactor());
      } else break;
    }
    return left;
  }

  parseFactor(): Expr {
    this.skipWs();
    if (this.match("-")) return neg(this.parseFactor());
    if (this.match("+")) return this.parseFactor();
    if (this.match("(")) {
      const e = this.parseExpr();
      if (!this.match(")")) throw new Error("Missing )");
      return this.parsePower(e);
    }
    const ch = this.s[this.i];
    if (ch && /[0-9.]/.test(ch)) return this.parsePower(this.parseNumber());
    if (ch && /[A-Za-z_]/.test(ch)) return this.parsePower(this.parseIdent());
    throw new Error(`Unexpected "${ch ?? "end"}"`);
  }

  parsePower(base: Expr): Expr {
    this.skipWs();
    if (this.s[this.i] === "^") {
      this.i++;
      this.skipWs();
      let sign = 1;
      if (this.s[this.i] === "-") { sign = -1; this.i++; }
      let digits = "";
      while (!this.eof() && /[0-9]/.test(this.s[this.i])) { digits += this.s[this.i]; this.i++; }
      if (!digits) throw new Error("Expected exponent");
      const p = sign * parseInt(digits, 10);
      // power only supported for monomials
      if (base.terms.length === 1 && Object.keys(base.terms[0].v).length === 1 && rEq(base.terms[0].c, R1)) {
        const k = Object.keys(base.terms[0].v)[0];
        return E({ c: R1, v: { [k]: base.terms[0].v[k] * p } });
      }
      if (p < 0) throw new Error("Negative powers only allowed on simple variables");
      let out = ONE;
      for (let i = 0; i < p; i++) out = mul(out, base);
      return out;
    }
    return base;
  }

  parseNumber(): Expr {
    let s = "";
    while (!this.eof() && /[0-9]/.test(this.s[this.i])) { s += this.s[this.i]; this.i++; }
    if (this.s[this.i] === ".") {
      s += "."; this.i++;
      while (!this.eof() && /[0-9]/.test(this.s[this.i])) { s += this.s[this.i]; this.i++; }
    }
    if (s === "" || s === ".") throw new Error("Expected number");
    if (s.includes(".")) {
      // decimal -> rational
      const [whole, frac] = s.split(".");
      const d = 10n ** BigInt(frac.length);
      const n = BigInt(whole + frac);
      return fromRational(rat(n, d));
    }
    return fromInt(BigInt(s));
  }

  parseIdent(): Expr {
    let s = "";
    while (!this.eof() && /[A-Za-z_0-9]/.test(this.s[this.i])) { s += this.s[this.i]; this.i++; }
    return fromVar(s);
  }
}

// Safe parse — returns ZERO with no throw for empty input; otherwise rethrows.
export function tryParse(input: string): Expr {
  return parse(input);
}
