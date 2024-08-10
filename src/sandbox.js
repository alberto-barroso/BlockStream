const isolatedVM = require('isolated-vm');

class Sandbox {
    constructor() {
        this.isolate = new isolatedVM.Isolate();
    }

    async execute(code, context) {
        const contextObj = await this.isolate.createContext();
        const script = await this.isolate.compileScript(code);
        try {
            const result = await script.run(contextObj);
            return result;
        } catch (error) {
            throw new Error(`Execution Error: ${error.message}`);
        }
    }
}

module.exports = Sandbox;
