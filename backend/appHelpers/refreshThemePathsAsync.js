const refreshThemePathsAsync = () => {
    return new Promise((resolve, reject) => {
        const dbAccess = require("../db/db.access");
        const bibleTheme = require("../models/bibleTheme.model");
        const theme = new bibleTheme;
        const selectString = theme.getSelectString();

        dbAccess.query(selectString, (err, response) => {
            if (err) {
                reject(err);
                return;
            }

            let themeList;
            const paths = [];
            const getChildPaths = (theme, visited) => {
                if (visited.has(theme.id)) {
                    throw new Error(`Circular theme parent relationship detected at theme ${theme.id}`);
                }

                visited.add(theme.id);

                var parentPath = paths[theme.id].path;
                var childThemes = [];
                themeList.map(th => {
                    if (th.parent == theme.id) {
                        childThemes.push(th);
                    }
                });

                for (var i = 0; i < childThemes.length; i++) {
                    var path = `${parentPath}/${childThemes[i].name}`;
                    paths[childThemes[i].id] = {
                        id: childThemes[i].id,
                        name: childThemes[i].name,
                        description: childThemes[i].description,
                        parent: theme.id,
                        sequence: theme.sequence,
                        childCount: theme.childCount,
                        path: path
                    };
                    getChildPaths(childThemes[i], new Set(visited));
                }
            };

            if (response) {
                const roots = [];
                themeList = response;
                themeList.map(theme => {
                    if (!theme.parent) {
                        roots.push(theme)
                    }
                });

                for (var i = 0; i < roots.length; i++) {
                    paths[roots[i].id] = {
                        id: roots[i].id,
                        name: roots[i].name,
                        description: roots[i].description,
                        parent: 0,
                        sequence: roots[i].sequence,
                        childCount: roots[i].childCount,
                        path: `/${roots[i].name}`
                    };

                    try {
                        getChildPaths(roots[i], new Set());
                    }
                    catch (err) {
                        reject(err);
                        return;
                    }
                }

                global.themePaths = paths;
                resolve();
            }
            else {
                reject("RefreshThemePathsAsync query failed");
            }
        });
    });
}

module.exports = refreshThemePathsAsync;
