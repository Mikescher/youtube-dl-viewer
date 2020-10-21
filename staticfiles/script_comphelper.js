class CompareUtil {
    static sortcompare(a, b, key) {
        const va = a.data.info[key];
        const vb = b.data.info[key];
        return this.sortcompareValues(va, vb);
    }
    static sortcompareData(a, b, key) {
        const va = a.data[key];
        const vb = b.data[key];
        return this.sortcompareValues(va, vb);
    }
    static sortcompareMeta(a, b, key) {
        const va = a.meta[key];
        const vb = b.meta[key];
        return this.sortcompareValues(va, vb);
    }
    static sortcompareValues(va, vb) {
        if (va === undefined && vb === undefined)
            return 0;
        if (va === undefined)
            return +1;
        if (vb === undefined)
            return -1;
        if (va === null && vb === null)
            return 0;
        if (va === null)
            return +1;
        if (vb === null)
            return -1;
        if (typeof va !== typeof vb)
            throw new Error('sortcompare type confusion (1)');
        if (typeof va === "number")
            return va - vb;
        if (typeof va === "string")
            return va.toLowerCase().localeCompare(vb.toLowerCase());
        if (Array.isArray(va) && Array.isArray(vb)) {
            if (va.length > 0 && vb.length > 0)
                return this.sortcompareValues(va[0], vb[0]);
            if (va.length > 0)
                return -1;
            if (vb.length > 0)
                return +1;
        }
        throw new Error('sortcompare type confusion (2)');
    }
    static sortcompareDiv(a, b, key1, key2) {
        const va1 = a.data.info[key1];
        const vb1 = b.data.info[key1];
        if (va1 === undefined && vb1 === undefined)
            return 0;
        if (va1 === undefined)
            return +1;
        if (vb1 === undefined)
            return -1;
        if (va1 === null && vb1 === null)
            return 0;
        if (va1 === null)
            return +1;
        if (vb1 === null)
            return -1;
        const va2 = a.data.info[key2];
        const vb2 = b.data.info[key2];
        if (va2 === undefined && vb2 === undefined)
            return 0;
        if (va2 === undefined)
            return +1;
        if (vb2 === undefined)
            return -1;
        if (va2 === null && vb2 === null)
            return 0;
        if (va2 === null)
            return +1;
        if (vb2 === null)
            return -1;
        if (typeof va1 !== "number")
            throw new Error('sortcompareDiv type confusion (a1)');
        if (typeof vb1 !== "number")
            throw new Error('sortcompareDiv type confusion (b1)');
        if (typeof va2 !== "number")
            throw new Error('sortcompareDiv type confusion (a2)');
        if (typeof vb2 !== "number")
            throw new Error('sortcompareDiv type confusion (b2)');
        return this.sortcompareValues(va1 / va2, vb1 / vb2);
    }
}
