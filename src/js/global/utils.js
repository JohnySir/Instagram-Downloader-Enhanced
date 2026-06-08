// Different scope, have to redeclare: https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=vi#type-ExecutionWorld
function getValueByKey(obj, key) {
    if (typeof obj !== 'object' || obj === null) return null;
    const stack = [obj];
    const visited = new Set();
    let count = 0;
    while (stack.length && count < 2000) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        count++;

        try {
            if (Object.prototype.hasOwnProperty.call(current, key)) return current[key];
            if (current[key] !== undefined) return current[key];
        } catch (error) {}

        const isNode = current instanceof Node;
        const keys = Object.keys(current);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (isNode && !k.startsWith('__react')) continue;
            try {
                const value = current[k];
                if (value && typeof value === 'object' && !(value instanceof Node)) {
                    stack.push(value);
                }
            } catch (error) {}
        }
    }
    return null;
}
