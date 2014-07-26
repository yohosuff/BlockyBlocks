$(document).ready(blockyBlocks);

function blockyBlocks() {

    var PieceType = Object.freeze({ PIECE_I:0, PIECE_O:1, PIECE_T:2, PIECE_S:3, PIECE_Z:4, PIECE_J:5, PIECE_L:6 });

    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var lastTime = Date.now();
    var normalDropRate = 600;
    var fastDropRate = 50;
    var dropRate = normalDropRate;
    var moveSidewaysDelay = 200;
    var lastTime_moveSideways = Date.now();
    var grid = [];
    var display_grid = [];
    var keyStates = {};
    var blockSize = 32;
    var gridWidth = 7;
    var gridHeight = 20;
    var piece;
    var lastTime_rotate = 0;
    var rotateDelay = 500;

    var keyChar = {
        "a": 65,
        "s": 83,
        "d": 68,
        "w": 87
    };

    function Cell() {
        this.color = "#FFFFFF";
        this.locked = false;
    }

    function Block() {
        this.x = 0;
        this.y = 0;
        this.color = "#00FFFF";

        this.clone = function () {
            var copy = new Block();
            copy.x = this.x;
            copy.y = this.y;
            copy.color = this.color;
            return copy;
        }
    }

    function PieceDefinition(shape) {
        this.blocks = [];
        this.type = shape;

        this.initialize = function() {
            if(this.type == PieceType.PIECE_I) this.turnIntoI();
            else if(this.type == PieceType.PIECE_J) this.turnIntoJ();
            else if(this.type == PieceType.PIECE_L) this.turnIntoL();
            else if(this.type == PieceType.PIECE_O) this.turnIntoO();
            else if(this.type == PieceType.PIECE_S) this.turnIntoS();
            else if(this.type == PieceType.PIECE_T) this.turnIntoT();
            else if(this.type == PieceType.PIECE_Z) this.turnIntoZ();
            else console.log("No type set for Piece Definition");
        };
        
        this.turnIntoI = function () {
            this.removeAllBlocks();
            var color = "blue";
            this.addBlock(0,-1, color);
            this.addBlock(0, 0, color);
            this.addBlock(0, 1, color);
            this.addBlock(0, 2, color);
            this.type = PieceType.PIECE_I;
        };

        this.turnIntoO = function () {
            this.removeAllBlocks();
            var color = "orange";
            this.addBlock(0, 0, color);
            this.addBlock(0, 1, color);
            this.addBlock(1, 0, color);
            this.addBlock(1, 1, color);
            this.type = PieceType.PIECE_O;
        };

        this.turnIntoT = function () {
            this.removeAllBlocks();
            var color = "purple";
            this.addBlock(-1, 0, color);
            this.addBlock( 0, 0, color);
            this.addBlock( 1, 0, color);
            this.addBlock( 0, 1, color);
            this.type = PieceType.PIECE_T;
        };

        this.turnIntoS = function(){
            this.removeAllBlocks();
            var color = "green";
            this.addBlock(-1, 0, color);
            this.addBlock( 0, 0, color);
            this.addBlock( 0, 1, color);
            this.addBlock( 1, 1, color);
            this.type = PieceType.PIECE_S;
        };

        this.turnIntoZ = function(){
            this.removeAllBlocks();
            var color = "red";
            this.addBlock(-1, 1, color);
            this.addBlock( 0, 1, color);
            this.addBlock( 0, 0, color);
            this.addBlock( 1, 0, color);
            this.type = PieceType.PIECE_Z;
        };

        this.turnIntoJ = function(){
            this.removeAllBlocks();
            var color = "brown";
            this.addBlock( 0, 1, color);
            this.addBlock( 0, 0, color);
            this.addBlock( 0,-1, color);
            this.addBlock(-1,-1, color);
            this.type = PieceType.PIECE_J;
        };

        this.turnIntoL = function(){
            this.removeAllBlocks();
            var color = "grey";
            this.addBlock( 0, 1, color);
            this.addBlock( 0, 0, color);
            this.addBlock( 0,-1, color);
            this.addBlock( 1,-1, color);
            this.type = PieceType.PIECE_L;
        };

        this.removeAllBlocks = function () {
            this.blocks = [];
        };

        this.addBlock = function (x, y, color) {
            var block = new Block();
            block.x = x;
            block.y = y;
            block.color = color;
            this.blocks.push(block);
        };

        this.initialize();
    }

    var ShapeDefinition = Object.freeze({
        PIECE_I:0,
        PIECE_O:1,
        PIECE_T:2 });

    function Piece() {
        this.blocks = [];
        this.x = 3;
        this.y = 0;
        this.type = null;
        this.rotation = 0;

        this.getBlocks = function () {
            //calculate absolute blocks from relative blocks
            var realBlocks = [];
            for (var i = 0; i < this.blocks.length; ++i) {
                var block = new Block();
                block.x = this.x + this.blocks[i].x;
                block.y = this.y + this.blocks[i].y;
                block.color = this.blocks[i].color;
                realBlocks.push(block);
            }
            return realBlocks;
        };

        this.inBounds = function (x_mod) {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (block.x + x_mod < 0 || block.x + x_mod > grid[0].length - 1)
                    return false
            }
            return true;
        };

        this.isInBounds = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (block.x < 0 || block.x > grid[0].length - 1 || block.y > grid.length || block.y < 0)
                    return false
            }
            return true;
        };

        this.isAboveTop = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (block.y < 0)
                    return true
            }
            return false;
        };

        this.isOverLeftSide = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (block.x < 0)
                    return true
            }
            return false;
        };

        this.isOverRightSide = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (block.x > grid[0].length - 1)
                    return true
            }
            return false;
        };

        this.hasCollided = function (x_mod) {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (grid[block.y][block.x + x_mod].locked)
                    return true;
            }
            return false;
        };

        this.isColliding = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (grid[block.y][block.x].locked)
                    return true;
            }
            return false;
        };

        this.willLand = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                if (grid[block.y + 1][block.x].locked)
                    return true;
            }
            return false;
        };

        this.lock = function () {
            var realBlocks = this.getBlocks();
            for (var i = 0; i < realBlocks.length; ++i) {
                var block = realBlocks[i];
                grid[block.y][block.x].locked = true;
                grid[block.y][block.x].color = block.color;
            }
        };

        this.rotate = function () {
            if(this.type == "square")
                return;

            for (var i = 0; i < this.blocks.length; ++i) {
                var block = this.blocks[i];
                var x_prime = -block.y;
                var y_prime = block.x;
                block.x = x_prime;
                block.y = y_prime;
                this.rotation = this.rotation >= 3 ? 0 : this.rotation + 1;
            }
        };

        this.setRotation = function () {

        };

        this.resetRotation = function () {
            this.turnIntoShape(new PieceDefinition(this.type));
        };

        this.clone = function () {
            var copy = new Piece();
            copy.x = this.x;
            copy.y = this.y;
            var arrayCopy = [];

            for (var i = 0; i < this.blocks.length; ++i)
                arrayCopy.push(this.blocks[i].clone());

            copy.blocks = arrayCopy;
            copy.type = this.type;
            copy.rotation = this.rotation;
            return copy;
        };

        this.getInBounds = function () {
            while (this.isAboveTop()) {
                this.y++;
            }

            while (this.isOverLeftSide()) {
                this.x++;
            }

            while (this.isOverRightSide()) {
                this.x--;
            }
        };

        this.turnIntoRandom = function () {
            var shapes = [];
            shapes.push(new PieceDefinition(PieceType.PIECE_I));
            shapes.push(new PieceDefinition(PieceType.PIECE_J));
            shapes.push(new PieceDefinition(PieceType.PIECE_L));
            shapes.push(new PieceDefinition(PieceType.PIECE_O));
            shapes.push(new PieceDefinition(PieceType.PIECE_S));
            shapes.push(new PieceDefinition(PieceType.PIECE_T));
            shapes.push(new PieceDefinition(PieceType.PIECE_Z));

            var randomInteger = getRandomInt(0, shapes.length - 1);
            this.turnIntoShape(shapes[randomInteger]);
        };

        this.turnIntoShape = function(shape) {
            this.removeAllBlocks();
            for(var i = 0; i < shape.blocks.length; ++i)
            {
                var block = shape.blocks[i];
                this.blocks.push(block.clone());
            }
            this.type = shape.type;
        };

        this.removeAllBlocks = function () {
            this.blocks = [];
        };

        this.addBlock = function (x, y, color) {
            var block = new Block();
            block.x = x;
            block.y = y;
            block.color = color;
            this.blocks.push(block);
        }
    }



    function GetNextPiece() {
        piece.turnIntoRandom();
        piece.x = Math.floor(grid[0].length / 2);
        piece.y = 0;
        piece.getInBounds();
        piece.resetRotation();
    }

    function initializePieces() {
        piece = new Piece();
        GetNextPiece();
    }

    function initializeGrid() {
        grid = [];

        for (var i = 0; i < gridHeight; ++i) {
            var row = [];
            for (var j = 0; j < gridWidth; ++j)
                row.push(new Cell());
            grid.push(row);
        }

        row = [];
        for (var k = 0; k < grid[0].length; ++k) {
            var cell = new Cell();
            cell.locked = true;
            cell.color = "#000000";
            row.push(cell);
        }
        grid.push(row);

        canvas.width = blockSize * gridWidth;
        canvas.height = blockSize * (gridHeight + 1);
    }

    function drawGrid() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (var r = 0; r < display_grid.length; ++r)
            for (var c = 0; c < display_grid[0].length; ++c) {
                var size = blockSize;
                cell = display_grid[r][c];
                context.fillStyle = cell.color;
                context.fillRect(c * size, r * size, size, size);
                context.beginPath();
                context.rect(c * size, r * size, size, size);
                context.lineWidth = 1;
                context.strokeStyle = 'black';
                context.stroke();
            }
    }

    function logic() {
        var timeNow = Date.now();
        if (timeNow - lastTime > dropRate) {
            lastTime = timeNow;

            if (piece.willLand()) {
                piece.lock();

                if (!gridIsPlayable()) {
                    initializeGrid();
                }

                CheckForLines();
                GetNextPiece();
            }
            else {
                piece.y++;
            }
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function CheckForLines() {
        var lineIndexes = [];

        for (var i = grid.length - 2; i >= 0; --i) {
            var isLine = true;
            for (var j = 0; j < grid[0].length; ++j) {
                if (!grid[i][j].locked) {
                    isLine = false;
                    j = grid[0].length;
                }
            }

            if (isLine) {
                lineIndexes.push(i);
            }

        }

        for (var i = 0; i < lineIndexes.length; ++i) {
            grid.splice(lineIndexes[i], 1);
        }

        for (var i = 0; i < lineIndexes.length; ++i) {
            var row = [];
            for (var j = 0; j < grid[0].length; ++j)
                row.push(new Cell());
            grid.splice(0, 0, row);
        }
    }

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    function gridIsPlayable() {
        for (var i = 0; i < grid[0].length; ++i)
            if (grid[0][i].locked)
                return false;
        return true;
    }

    function placePiece() {
        display_grid = CopyGrid(grid);
        var blocks = piece.getBlocks();
        for (var i = 0; i < blocks.length; ++i) {
            var block = blocks[i];
            display_grid[block.y][block.x].color = block.color;
        }
    }

    function CopyGrid() {
        var copy = [];

        for (var i = 0; i < grid.length; ++i) {
            copy.push([]);
            for (var j = 0; j < grid[0].length; ++j) {
                var oldCell = grid[i][j];
                var cell = new Cell();
                cell.color = oldCell.color;
                copy[i].push(cell);
            }
        }

        return copy;
    }

    function keys() {
        var timeNow = Date.now();

        if (key("a") && timeNow - lastTime_moveSideways > moveSidewaysDelay && piece.inBounds(-1) && !piece.hasCollided(-1)) {
            piece.x--;
            lastTime_moveSideways = timeNow;
        } else if (key("d") && timeNow - lastTime_moveSideways > moveSidewaysDelay && piece.inBounds(1) && !piece.hasCollided(1)) {
            piece.x++;
            lastTime_moveSideways = timeNow;
        }

        if (key("s")) {
            dropRate = fastDropRate;
        }
        else {
            dropRate = normalDropRate;
        }

        if (key("w") && timeNow - lastTime_rotate > rotateDelay) {

            var pieceCopy = piece.clone();
            pieceCopy.rotate();
            pieceCopy.getInBounds();

            if (!(!pieceCopy.isInBounds() || pieceCopy.isColliding())) {
                lastTime_rotate = timeNow;
                piece.x = pieceCopy.x;
                piece.y = pieceCopy.y;
                piece.rotate();
            }

        }
    }

    function key(k) {
        return keyStates[keyChar[k]];
    }

    function loop() {
        keys();
        logic();
        placePiece();
        drawGrid();
    }

    function SetupEventHandlers() {
        $(document).keydown(function () {
            keyStates[event.keyCode] = true;
        });

        $(document).keyup(function () {
            keyStates[event.keyCode] = false;

            if (keyChar["a"] == event.keyCode || keyChar["d"] == event.keyCode) {
                lastTime_moveSideways = 0;
            }
            else if (keyChar["w"] == event.keyCode) {
                lastTime_rotate = 0;
            }
        });

        $("#canvas").mousemove(function(e){
            //var x = e.clientX - $(this).offset().left;
            //piece.x = Math.floor((x / (gridWidth * blockSize) ) * gridWidth);
        });
    }


    initializeGrid();
    initializePieces();
    GetNextPiece();
    SetupEventHandlers();
    var loop_variable = setInterval(loop, 1000 / 60);

}

