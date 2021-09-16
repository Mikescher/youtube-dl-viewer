/*
Copyright 2019 David Bau.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import prng = seedrandom.prng;
import State = seedrandom.State;

declare namespace seedrandom {

    export type State = {};

    interface prng {
        new (seed?: string, options?: seedRandomOptions, callback?: any): prng;
        (): number;
        quick(): number;
        int32(): number;
        double(): number;
        state(): State;
    }

    interface seedrandom_prng {
        (seed?: string, options?: seedRandomOptions, callback?: seedrandomCallback): prng;
        alea: (seed?: string, options?: seedRandomOptions) => prng;
        xor128: (seed?: string, options?: seedRandomOptions) => prng;
        tychei: (seed?: string, options?: seedRandomOptions) => prng;
        xorwow: (seed?: string, options?: seedRandomOptions) => prng;
        xor4096: (seed?: string, options?: seedRandomOptions) => prng;
        xorshift7: (seed?: string, options?: seedRandomOptions) => prng;
        quick: (seed?: string, options?: seedRandomOptions) => prng;
    }

    interface seedrandomCallback {
        (prng?: prng, shortseed?: string, global?: boolean, state?: State): prng;
    }

    interface seedRandomOptions {
        entropy?: boolean;
        'global'?: boolean;
        state?: boolean | State;
        pass?: seedrandomCallback;
    }
    
}

class SeedRandom
{
    static func: any;

    readonly seed: string;
    readonly srobj: prng;
    
    constructor(seed: string)
    {
        this.seed = seed;
        this.srobj = new SeedRandom.func(seed);
    }

    quick():  number { return this.srobj.quick();  }
    int32():  number { return this.srobj.int32();  }
    double(): number { return this.srobj.double(); }
    state():  State  { return this.srobj.state();  }
}

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
class ARC4
{
    i: number;
    j: number;
    S: number[];

    width: number;
    mask: number;
    
    constructor(key: number[], width: number, mask: number) {
        let keylen = key.length;
        let i = 0;
        let j = 0;
        this.i = 0;
        this.j = 0;

        this.S = []
        
        this.mask = mask;
        this.width = width;
        
        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            this.S[i] = i++;
        }
        for (i = 0; i < width; i++) {
            let t = this.S[i]
            this.S[i] = this.S[j = mask & (j + key[i % keylen] + t)];
            this.S[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        this.g(width);
    }
    
    g(count: number) {
        // Using instance members instead of closure state nearly doubles speed.
        let t;
        let r = 0;
        let i = this.i;
        let j = this.j;
        let s = this.S;
        while (count--) {
            t = s[i = this.mask & (i + 1)];
            r = r * this.width + s[this.mask & ((s[i] = s[j = this.mask & (j + t)]) + (s[j] = t))];
        }
        this.i = i;
        this.j = j;
        return r;
        // For robust unpredictability, the function call below automatically
        // discards an initial batch of values.  This is called RC4-drop[256].
        // See http://google.com/search?q=rsa+fluhrer+response&btnI
    }
}

function seedrandom_init(global: typeof globalThis) {
    let width = 256;        // each RC4 output is 0 <= x < 256
    let chunks = 6;         // at least six RC4 outputs for each double
    let digits = 52;        // there are 52 significant digits in a double
    let startdenom = Math.pow(width, chunks);
    let significance = Math.pow(2, digits);
    let overflow = significance * 2;
    let mask = width - 1;
    
    let pool: number[] = [];

//
// seedrandom()
// This is the seedrandom function described above.
//
    function seedrandom(seed: string): prng {
        var key: number[] = [];

        // Flatten the seed string or build one from local entropy if needed.
        var shortseed = mixkey(flatten((seed == null) ? autoseed() : seed, 3), key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(key, width, mask);

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        var prng = function() {
            var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
                d = startdenom,                 //   and denominator d = 2 ^ 48.
                x = 0;                          //   and no 'extra last byte'.
            while (n < significance) {          // Fill up all significant digits by
                n = (n + x) * width;              //   shifting numerator and
                d *= width;                       //   denominator and generating a
                x = arc4.g(1);                    //   new least-significant-byte.
            }
            while (n >= overflow) {             // To avoid rounding up, before adding
                n /= 2;                           //   last byte, shift everything
                d /= 2;                           //   right using integer math until
                x >>>= 1;                         //   we have exactly the desired bits.
            }
            return (n + x) / d;                 // Form the number within [0, 1).
        } as seedrandom.prng;

        prng.int32 = function() { return arc4.g(4) | 0; }
        prng.quick = function() { return arc4.g(4) / 0x100000000; }
        prng.double = prng;

        // Mix the randomness into accumulated entropy.
        mixkey(tostring(arc4.S), pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return prng;
    }

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
    function copy(f: ARC4, t: any) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    };

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
    function flatten(obj: any, depth: number): string[] {
        var result = [], typ = (typeof obj), prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
            }
        }
        return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
    function mixkey(seed: any, key: number[]): string {
        let stringseed = seed + '';
        let smear = 0;
        let j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
                mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return tostring(key);
    }

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
    function autoseed() {
        try {
            var out;
            out = new Uint8Array(width);
            global.crypto.getRandomValues(out);
            return tostring(Array.from(out));
        } catch (e) {
            var browser = global.navigator,
                plugins = browser && browser.plugins;
            return [+new Date, global, plugins, global.screen, tostring(pool)];
        }
    }

//
// tostring()
// Converts an array of charcodes to a string
//
    function tostring(a: number[]): string {
        return String.fromCharCode.apply(0, a);
    }

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
    mixkey(Math.random(), pool);

    SeedRandom.func = seedrandom;

}

seedrandom_init(
    // global: `self` in browsers (including strict mode and web workers),
    // otherwise `this` in Node and other environments
    (typeof self !== 'undefined') ? self : this,
);
