class responseTools {
    constructor() { }


    getObjectFromResult = (result, increment) => {
        var suffix = increment ? increment : "";
        var obj = {};
        const keys = this.getIncrementKeys(result, increment);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            obj[key] = result[key + suffix];
        }

        return this.reformatDateValues(obj);
    }

    getIncrementKeys = (result, increment) => {
        const pattern = /(.*?)(\d+)$/;
        const keys = Object.keys(result);
        var incrementKeys = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var res = key.match(pattern);
            if (increment) {
                if (res && res.length > 2 && res[2] == increment) {
                    incrementKeys.push(res[1]);
                }
            }
            else {
                if (!res) {
                    incrementKeys.push(key);
                }
            }
        }

        return incrementKeys;
    }

    buildExtendedTheme = (results) => {
        var theme = null;

        if (results != null && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (theme === null) {
                    theme = this.getObjectFromResult(result, 1);
                    theme.path = global.themePaths[theme.id].path;
                    theme.themes = [];
                    theme.themeToCitationLinks = [];
                }

                var newChildTheme = this.getObjectFromResult(result, 2);
                if (newChildTheme) {
                    var activeChildTheme = null;
                    theme.themes.map(th => {
                        if (th.theme.id == newChildTheme.id) {
                            activeChildTheme = th;
                        }
                    });

                    if (!activeChildTheme && newChildTheme.id) {
                        activeChildTheme = newChildTheme;
                        activeChildTheme.path = global.themePaths[activeChildTheme.id].path;
                        theme.themes.push({ theme: activeChildTheme });
                    }
                }

                var newThemeToCitation = this.getObjectFromResult(result, 3);
                if (newThemeToCitation) {
                    var activeThemeToCitation = null;
                    theme.themeToCitationLinks.map(link => {
                        if (link.themeToCitation.id == newThemeToCitation.id) {
                            activeThemeToCitation = link;
                        }
                    });

                    if (!activeThemeToCitation && newThemeToCitation.id) {
                        activeThemeToCitation = newThemeToCitation;
                        activeThemeToCitation.citation = this.getObjectFromResult(result, 4);
                        activeThemeToCitation.citation.description = activeThemeToCitation.citation.description ? activeThemeToCitation.citation.description : "";
                        theme.themeToCitationLinks.push({ themeToCitation: activeThemeToCitation });
                    }
                }
            }

            theme.themes.sort((a, b) => a.theme.sequence - b.theme.sequence);
            theme.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence);
        }

        return theme;
    }

    reformatDateValues = (obj) => {
        for (var propName in obj) {
            var value = obj[propName];
            if (value && Date.prototype.isPrototypeOf(value)) {
                var str = value.toISOString().slice(0, 19).replace('T', ' ');
                obj[propName] = str;
            }
        }

        return obj;
    }
};

module.exports = responseTools;