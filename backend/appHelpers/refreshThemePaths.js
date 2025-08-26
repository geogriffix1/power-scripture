refreshThemePaths = () => {
    const dbAccess = require("../db/db.access");
    const bibleTheme = require("../models/bibleTheme.model");
    const theme = new bibleTheme;
    const selectString = theme.getSelectString();

    dbAccess.query(selectString, (err, response) => {
        var themeList;
        paths = [];
        getChildPaths = (theme) => {
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
                getChildPaths(childThemes[i]);
            }
        };

        if (response) {
            const roots = [];
            for (var i = 0; i < roots.length; i++) {
                paths[roots[i].id] = `/${roots[i].name}`;
                getChildPaths(roots[i]);
            }

            themeList = response;
            console.log(themeList);
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
                getChildPaths(roots[i]);
            }

            global.themePaths = paths;
            //console.log(JSON.stringify(global.themePaths));
        }
    });
};

module.exports = refreshThemePaths;