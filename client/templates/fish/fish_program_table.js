var program = false;
var codebox = false;
var cells = [];

/********************
 * fishProgramTable *
 ********************/

Template.fishProgramTable.onCreated(function() {
	// The program should be the input object
	program = this.data;
	codebox = program.codebox;
});

Template.fishProgramTable.helpers({
	lines: function() {
		var lines = [];
		for (var y = 0; y < codebox.height; y++) {
			cells[y] = [];
			lines.push(y);
		}
		return lines;
	}
});

// Event listener function
function codechanged(e) {
	cells[e.detail.location.line][e.detail.location.char].text(e.detail.newCode);
};

Template.fishProgramTable.onRendered(function() {
	// Set up event handlers and other to control the table
	var ip;
	var $currentCell = $("<div/>");	// Dummy element

	// React to the IP moving
	function moved(e) {
		$currentCell.removeClass("instruction-pointer");

		ip = program.ip.location;
		$currentCell = cells[ip.line][ip.char];

		$currentCell.addClass("instruction-pointer");
	};
	moved();
	program.addEventListener("moved", moved);

	// React to code changing
	program.addEventListener("codechanged", codechanged);
});

Template.fishProgramTable.onDestroyed(function() {
	program.removeEventListener("codechanged", codechanged);
});

/************************
 * fishProgramTableLine *
 ************************/

Template.fishProgramTableLine.helpers({
	characters: function() {
		var y = this;
		var characters = [];
		for (var x = 0; x < codebox.width; x++) {
			cells[y][x] = {};
			characters.push({x: x, y: y});
		}
		return characters;
	}
});

/*****************************
 * fishProgramTableCharacter *
 *****************************/

Template.fishProgramTableCharacter.onRendered(function() {
	// Put the td into the cell array
	var $td = $(this.firstNode);
	var instruction = codebox[this.data.x + " " + this.data.y];
	if (instruction !== 0) {
		$td.text(instruction);
	} else {
		$td.text(" ");
	}
	cells[this.data.y][this.data.x] = $td;
});
