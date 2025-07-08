/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 * Converted to TypeScript.
 */

interface JsonPathArgs {
  resultType?: "VALUE" | "PATH";
}

interface JsonPathInternal {
  resultType: "VALUE" | "PATH";
  result: any[];
  normalize: (expr: string) => string;
  asPath: (path: string) => string;
  store: (p: string, v: any) => boolean;
  trace: (expr: string, val: any, path: string) => void;
  walk: (
    loc: string,
    expr: string,
    val: any,
    path: string,
    f: (m: string | number, l: string, x: string, v: any, p: string) => void
  ) => void;
  slice: (loc: string, expr: string, val: any, path: string) => void;
  eval: (x: string, _v: any, _vname: string | number) => any;
}

export function jsonPath(
  obj: any,
  expr: string,
  arg?: JsonPathArgs
): any[] | false {
  const P: JsonPathInternal = {
    resultType: arg?.resultType || "VALUE",
    result: [],
    normalize: function (expr: string): string {
      const subx: string[] = [];
      return expr
        .replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
          return "[#" + (subx.push($1) - 1) + "]";
        })
        .replace(/'?\.'?|\['?/g, ";")
        .replace(/;;;|;;/g, ";..;")
        .replace(/;$|'?\]|'$/g, "")
        .replace(/#([0-9]+)/g, function ($0, $1) {
          return subx[parseInt($1, 10)];
        });
    },
    asPath: function (path: string): string {
      const x: string[] = path.split(";");
      let p: string = "$";
      for (let i = 1, n = x.length; i < n; i++)
        p += /^[0-9*]+$/.test(x[i]) ? "[" + x[i] + "]" : "['" + x[i] + "']";
      return p;
    },
    store: function (p: string, v: any): boolean {
      if (p)
        P.result[P.result.length] = P.resultType === "PATH" ? P.asPath(p) : v;
      return !!p;
    },
    trace: function (expr: string, val: any, path: string): void {
      if (expr) {
        let x: string[] = expr.split(";");
        const loc: string = x.shift()!;
        let remainingExpr: string = x.join(";");

        if (
          val &&
          typeof val === "object" &&
          val !== null &&
          Object.prototype.hasOwnProperty.call(val, loc)
        ) {
          P.trace(remainingExpr, val[loc], path + ";" + loc);
        } else if (loc === "*") {
          P.walk(loc, remainingExpr, val, path, function (m, l, x, v, p) {
            P.trace(m + ";" + x, v, p);
          });
        } else if (loc === "..") {
          P.trace(remainingExpr, val, path);
          P.walk(loc, remainingExpr, val, path, function (m, l, x, v, p) {
            if (typeof v[m] === "object" && v[m] !== null) {
              P.trace("..;" + x, v[m], p + ";" + m);
            }
          });
        } else if (/,/.test(loc)) {
          // [name1,name2,...]
          const s: string[] = loc.split(/'?,'?/);
          for (let i = 0, n = s.length; i < n; i++) {
            P.trace(s[i] + ";" + remainingExpr, val, path);
          }
        } else if (/^\(.*?\)$/.test(loc)) {
          // [(expr)]
          P.trace(
            P.eval(loc, val, path.substring(path.lastIndexOf(";") + 1)) +
              ";" +
              remainingExpr,
            val,
            path
          );
        } else if (/^\?\(.*?\)$/.test(loc)) {
          // [?(expr)]
          P.walk(loc, remainingExpr, val, path, function (m, l, x, v, p) {
            if (P.eval(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) {
              P.trace(m + ";" + x, v, p);
            }
          });
        } else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) {
          // [start:end:step] python slice syntax
          P.slice(loc, remainingExpr, val, path);
        }
      } else {
        P.store(path, val);
      }
    },
    walk: function (
      loc: string,
      expr: string,
      val: any,
      path: string,
      f: (m: string | number, l: string, x: string, v: any, p: string) => void
    ): void {
      if (Array.isArray(val)) {
        for (let i = 0, n = val.length; i < n; i++) {
          if (i in val) {
            f(i, loc, expr, val, path);
          }
        }
      } else if (typeof val === "object" && val !== null) {
        for (const m in val) {
          if (Object.prototype.hasOwnProperty.call(val, m)) {
            f(m, loc, expr, val, path);
          }
        }
      }
    },
    slice: function (loc: string, expr: string, val: any, path: string): void {
      if (Array.isArray(val)) {
        const len: number = val.length;
        let start: number = 0;
        let end: number = len;
        let step: number = 1;
        loc.replace(
          /^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g,
          function ($0, $1, $2, $3) {
            start = parseInt($1 || start.toString(), 10);
            end = parseInt($2 || end.toString(), 10);
            step = parseInt($3 || step.toString(), 10);
            return ""; // Required by TS replace signature
          }
        );
        start = start < 0 ? Math.max(0, start + len) : Math.min(len, start);
        end = end < 0 ? Math.max(0, end + len) : Math.min(len, end);
        for (let i = start; i < end; i += step) {
          P.trace(i + ";" + expr, val, path);
        }
      }
    },
    eval: function (x: string, _v: any, _vname: string | number): any {
      // Using Function constructor instead of eval for slightly better isolation,
      // but still carries security risks if 'x' is untrusted.
      // Consider safer alternatives if 'x' can contain arbitrary user input.
      try {
        // @ts-ignore - Allows using _v and _vname in the Function scope
        return new Function(
          "_v",
          "_vname",
          `return (${x.replace(/@/g, "_v")})`
        )(_v, _vname);
      } catch (e: any) {
        throw new SyntaxError(
          "jsonPath: " + e.message + ": " + x.replace(/@/g, "_v")
        );
      }
    },
  };

  const $ = obj; // Alias for the object
  if (expr && obj && (P.resultType === "VALUE" || P.resultType === "PATH")) {
    P.trace(P.normalize(expr).replace(/^\$;/, ""), obj, "$");
    return P.result.length ? P.result : false;
  }
  return false; // Default return if conditions aren't met
}
