;(function ($, Snap, window, undefined) {

    var Field,
        i, j,
        speed = 100,
        properties = {
            xCount: 10,
            yCount: 10,
            cellWidth: 20,
            cellHeight: 20,
            minesCount: 10,
            flagsCount: undefined
        },
    // perimetr coordinates of the point
        aroundCoordinates = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ],

        Events  = {
            'open-cell': function () {},
            'place-flag': function () {},
            'win': function () {},
            'loose': function () {}
        },

    // TODO: Collect and return data in this function
        Evt = function (additionalData) {

        },

    // clear matrix
        clear = function (w, h) {
            var a = [];
            for (i = 0; i < w; i++) {
                var row = [];
                for (j = 0; j < h; j++) {
                    row.push(0);
                }
                a.push(row);
            }
            return a;
        },
        px = function (number) {
            return number + 'px';
        },
    // collect sum of the perimetr fields
        sum = function (x, y, matrix) {
            var sum = 0;
            for (var i = 0; i < aroundCoordinates.length; i++) {
                sum += matrix[x + aroundCoordinates[i][0]] !== undefined
                && matrix[x][y + aroundCoordinates[i][1]] !== undefined ? matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]] : 0;
            }
            return sum;
        },
        getFlaggedCells = function (x, y, matrix) {
            var sum = 0;
            for (var i = 0; i < aroundCoordinates.length; i++) {
                if (matrix[x + aroundCoordinates[i][0]] !== undefined
                    && matrix[x][y + aroundCoordinates[i][1]] !== undefined) {
                    var cell = matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]];
                    sum += cell.isFlag ? 1 : 0;
                }
            }
            return sum;
        };

    function Minesweeper() {
        return (this instanceof Minesweeper) ? this : new Minesweeper();
    }

    /**
     * Init the Main scope
     * @param field
     * @param options
     * @returns {Minesweeper}
     */
    Minesweeper.init = function init(field, options) {
        var $field = $(field);
        if ($field.prop("tagName") !== 'svg') {
            $('<svg/>').appendTo($field);
            field = field + ' svg';
        }

        $.extend(properties, options || {});

        properties.flagsCount = properties.minesCount;
        // disable right click on scene
        $(field).on('contextmenu', function () {
            return false;
        });

        Field = new BattleField(field);

        console.log('Init done');
        return Minesweeper;
    };

    Minesweeper.on = function (event, callback) {
        if(typeof callback === 'function') {
            Events[event] = callback;
        }
    };

    Minesweeper.fire = function (event, arguments) {
        Events[event].call(Minesweeper, Evt(arguments));
    };

    var Game = function () {

    };

    var BattleField = function (selector) {
        var field = this,
            ready = false,

            width = properties.xCount * properties.cellWidth,
            height = properties.yCount * properties.cellHeight,

            svgField = Snap(selector),
            $Field = $(selector),

            FieldMatrix = [],
            MinesMap = [],
            CountsMap = [],
            MatrixElement = function (data) {
                return $.extend({}, {
                    cell: undefined,
                    opened: false,
                    isMine: false,
                    isFlag: false,
                    minesCount: 0,
                    coordX: 0,
                    coordY: 0,
                    indexX: 0,
                    indexY: 0,
                    open: function () {
                        var self = this;
                        if (this.opened || this.isFlag) {
                            return false;
                        }
                        this.opened = true;
                        this.triggerFlag(false);
                        if (this.isMine > 0) {
                            this.cell.animate({
                                fill: 'red'
                            }, speed, function () {
                                svgField.text(self.coordX + 5, self.coordY + 15, 'B');
                                Minesweeper.fire('lose');
                            });
                        } else if (this.minesCount > 0) {
                            Minesweeper.fire('open-cell');
                            this.cell.animate({
                                fill: 'yellow'
                            }, speed, function () {
                                new Elements.NumberCell(self.indexX, self.indexY, self.minesCount);
                            });
                        } else {
                            Minesweeper.fire('open-cell');
                            this.cell.animate({
                                fill: 'green'
                            }, speed, function () {
                                field.open(self.indexX, self.indexY);
                            });
                        }
                    },
                    // place the flag on the scene
                    triggerFlag: function (val) {
                        if (val === undefined) {
                            this.isFlag = !this.isFlag;
                        } else {
                            this.isFlag = val;
                        }

                        if (this.isFlag) {
                            properties.flagsCount--;
                            this.cell.remove();
                            this.cell = new Elements.Flag(this.indexX, this.indexY, 'F');
                        } else {
                            properties.flagsCount++;
                            this.cell.remove();
                            this.cell = new Elements.DummyCell(this.indexX, this.indexY);
                        }
                    },
                    // when double click on numbered cell we open all around
                    openFromNumber: function () {
                        var flaggedCells = getFlaggedCells(this.indexX, this.indexY, FieldMatrix);
                        if (flaggedCells !== this.minesCount) {
                            return false;
                        }
                        field.open(this.indexX, this.indexY);
                    }
                }, data);
            },

            Elements = (function () {
                function events(cell, indexX, indexY) {
                    cell.mousedown(function (ev) {
                        switch (ev.button) {
                            case 0: //left mouse button
                                if (!ready) {
                                    field.init(indexX, indexY);
                                } else {
                                    FieldMatrix[indexX][indexY].open();
                                }
                                break;
                            case 2: // right mouse button
                                FieldMatrix[indexX][indexY].triggerFlag();
                                return false;
                                break;
                        }
                    });
                }

                return {
                    DummyCell: function (indexX, indexY) {
                        var coordX = indexX * properties.cellHeight;
                        var coordY = indexY * properties.cellWidth;

                        var cell = svgField.rect(coordX, coordY, properties.cellWidth, properties.cellHeight).attr({
                            fill: '#ccc',
                            stroke: "#000",
                            strokeWidth: 1
                        }).toggleClass('cell');

                        events(cell, indexX, indexY);

                        return cell;
                    },
                    Flag: function (indexX, indexY, text) {
                        var coordX = indexX * properties.cellHeight + 5;
                        var coordY = indexY * properties.cellWidth + 15;

                        var cell = svgField.text(coordX, coordY, text).toggleClass('cell');

                        events(cell, indexX, indexY);

                        return cell;
                    },
                    NumberCell: function (indexX, indexY, text) {
                        var coordX = indexX * properties.cellHeight + 5;
                        var coordY = indexY * properties.cellWidth + 15;

                        var cell = svgField.text(coordX, coordY, text).toggleClass('cell').dblclick(function () {
                            FieldMatrix[indexX][indexY].openFromNumber();
                        });

                        return cell;
                    }
                };
            })();

        /**
         * Calculate properties and dimentions for game area
         */
        (function buildField() {
            $Field.css({
                'display': 'block',
                'width': px(width),
                'height': px(height)
            });
        })();

        /**
         * First draw dummy elements
         */
        (function draw() {
            var coordX, coordY;
            for (i = 0; i < properties.xCount; i++) {
                var row = [];
                for (j = 0; j < properties.yCount; j++) {
                    coordX = i * properties.cellHeight;
                    coordY = j * properties.cellWidth;
                    row.push(new MatrixElement({
                        cell: new Elements.DummyCell(i, j),
                        coordX: coordX,
                        coordY: coordY,
                        indexX: i,
                        indexY: j
                    }));
                }
                FieldMatrix.push(row);
            }
        })();

        field.open = function (indexX, indexY) {
            for (i = 0; i < aroundCoordinates.length; i++) {
                if (FieldMatrix[indexX + aroundCoordinates[i][0]] !== undefined
                    && FieldMatrix[indexX][indexY + aroundCoordinates[i][1]] !== undefined) {
                    var elem = FieldMatrix[indexX + aroundCoordinates[i][0]][indexY + aroundCoordinates[i][1]];
                    elem.open();
                }
            }
        };

        field.init = function (indexX, indexY) {
            var minesCount = properties.minesCount;
            ready = true;
            // empty the mines map
            MinesMap = clear(properties.xCount, properties.yCount);
            CountsMap = clear(properties.xCount, properties.yCount);

            if ((properties.xCount * properties.yCount) / 2 < minesCount) {
                throw 'There are too many mines!'
            }

            // generate isMine field
            while (minesCount > 0) {
                var _x = parseInt(Math.random() * (properties.xCount - 0) + 0, 10);
                var _y = parseInt(Math.random() * (properties.yCount - 0) + 0, 10);
                var distance = Math.sqrt((indexX - _x) * (indexX - _x) + (indexY - _y) * (indexY - _y));


                if (MinesMap[_x][_y] !== 1 && distance > 3) {
                    MinesMap[_x][_y] = 1;
                    minesCount--;
                }
            }

            // generate count map
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    CountsMap[i][j] = sum(i, j, MinesMap);
                }
            }

            // generate battle field
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    FieldMatrix[i][j].isMine = MinesMap[i][j];
                    FieldMatrix[i][j].minesCount = CountsMap[i][j];
                }
            }

            field.open(indexX, indexY);

            console.log('Field init done!');
        };

        field.reload = function () {
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    FieldMatrix[i][j].cell.remove();
                }
            }

            field = new BattleField(selector);
        };

        return field;
    };

    window.Minesweeper = Minesweeper;
})(jQuery, Snap, window);