/**
 * Namespace for stuff related to the ><> (Fish) programming language
 *
 * @namespace
 */
Fish = {
	/**
	 * Turns the code into a codebox. All newline characters will be removed and turned into actual new lines.
	 * To get actual newline characters into the codebox, manipulate it using {@link Fish.Codebox#setInstructionAt}
	 *
	 * @param {String} code	Code to parse
	 *
	 * @constructor
	 *
	 * @memberof Fish
	 */
	Codebox: function(code) {
		// Always working reference to this
		var self = this;

		// Split the code into lines
		var grid = code.split("\n");

		// Important variables
		var width = 0;
		var height = grid.length;
		var codebox = {};

		// Split the code into individual characters
		(function() {
			for (var y = 0; y < height; y++) {
				grid[y] = grid[y].split("");

				// Check if this line is the longest this far
				if (grid[y].length > width) {
					width = grid[y].length;
				}

				for (var x = 0; x < grid[y].length; x++) {
						codebox[x + " " + y] = grid[y][x];
				}
			}
		})();

		// Delete the grid
		delete grid;

		// Make properties on this object
		Object.defineProperties(this, {
			/**
			 * Width of the code box
			 *
			 * @instance
	 		 * @memberof Fish.Codebox
			 */
			width: {get: function() {return width;}},
			/**
			 * Height of the code box
			 *
			 * @instance
	 		 * @memberof Fish.Codebox
			 */
			height: {get: function() {return height;}}
		});

		/**
		 * Function to get code at a point in the code box
		 *
		 * @param {Object} ip	Instruction pointer location
		 * @param {Number} ip.char	Character index
		 * @param {Number} ip.line	Line index
		 *
		 * @return {Number}	Charcode of the code at the given position
		 */
		this.getInstructionAt = function(ip) {
			if (typeof codebox[ip.char + " " + ip.line] == "undefined") {
				return 0;
			} else {
				return codebox[ip.char + " " + ip.line];
			}
		};

		/**
		 * Function to set code at a point in the code box
		 *
		 * @param {Object} ip	Instruction pointer location
		 * @param {Number} ip.char	Character index
		 * @param {Number} ip.line	Line index
		 * @param {Number} code	Charcode of the code to insert
		 */
		this.setInstructionAt = function(ip, code) {
			codebox[ip.char + " " + ip.line] = code;
			if (ip.char > width) {width = ip.char;}
			if (ip.line > height) {height = ip.line;}
		};

		/**
		 * Function to get ALL code points in the code box
		 *
		 * @return {Array}	An array with objects on the form {char: number, line: numer}
		 */
		this.getAllCodePoints = function() {
			var codePoints = [];
			for (var a in codebox) {
				var point = a.split(" ");
				codePoints.push({char: point[0], line: point[1]});
			}
			return codePoints;
		};
	},
	/**
	 * Parseis a codebox. Objects of this type are Event Emitters ({@link SoupEvents})
	 *
	 * @param {String|object} codebox	Either a string of code, or a {@link Fish#Codebox}
	 *
	 * @return {Fish.Parse}	An object which can control code execution and register event listeners (@see {@link SoupEvents}).
	 *
	 * @constructor
	 */
	Parse: function(code) {
		// Always working reference to this
		var self = this;

		// Make this an event emitter
		SoupEvents.makeEventEmitter(this);

		// The run-timeout
		var runTimeout = null;

		// Check if the code is a string, and turn it into a codebox if it is
		var codebox;
		if (typeof code == "string") {
			codebox = new Fish.Codebox(code);
		} else if (code instanceof Fish.Codebox) {
			codebox = code;
		} else {
			throw new Error("Invalid argument");
		}

		Object.defineProperties(this, {
			/**
			 * The {@link Fish.Codebox} of the program
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			codebox: {get: function() {
				var copy = {width: codebox.width, height: codebox.height};
				var codePoints = codebox.getAllCodePoints();
				while (codePoints.length > 0) {
					var point = codePoints.shift();
					copy[point.char + " " + point.line] = codebox.getInstructionAt(point);
				}
				return copy;
			}}
		});

		// Instruction pointer
		var ip = {char: -1, line: 0};

		// Current direction
		var dir = "E";

		Object.defineProperties(this, {
			/**
			 * Current location and direction of the instruction pointer
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			ip: {get: function() {
				char = started ? ip.char : 0;
				return {location: {char: char, line: ip.line}, direction: dir};
			}}
		});

		// Program is running
		var running = false;
		Object.defineProperties(this, {
			/**
			 * True if the program is currently running, false otherwise
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			running: {get: function() {return running;}}
		});

		// Program has not started
		var started = false;
		Object.defineProperties(this, {
			/**
			 * True if the program has been started, false otherwise
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			started: {get: function() {return started;}}
		});

		// Emit an event on error
		function error() {
			dispatchEvent("error", "Something smells fishy...");
			self.stop();
		};

		// Speed of the execution, Ticks Per Second
		var speed = 1;
		Object.defineProperties(this, {
			/**
			 * Speed of the execution, in Ticks per Second. Can be manipulated
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			speed: {
				get: function() {return speed;},
				set: function(newSpeed) {
					speed = parseFloat(newSpeed);
				}
			}
		});

		// The all-important stack
		var stack = new Fish.StackHandler();
		Object.defineProperties(this, {
			/**
			 * A copy of the current stack
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			stack: {get: function() {
				var copy = [];
				for (var i = 0; i < stack.current.length; i++) {
					copy.push(stack.current.get(i));
				}
				return copy;
			}}
		});
		function stackchanged() {
			dispatchEvent("stackchanged");
		};

		// I/O streams
		// In
		var stdin = new function() {
			// Characters in the stream
			var stream = [];

			// Reads a single number from the stream
			this.read = function() {
				if (stream.length > 0) {
					stack.current.push(stream.shift());
				} else {
					stack.current.push(-1);
				}
				dispatchEvent("inputconsumed");
			};

			// Writes a string into the stream
			this.write = function(str) {
				str = ("" + str).split("");
				for (var i = 0; i < str.length; i++) {
					stream.push(str[i].charCodeAt(0));
				}
			};

			// Returns the data in the stream as a string
			this.stream = function() {
				return stream.join(",");
			};
		};
		/**
		 * Perform operations on the input stream
		 */
		this.stdin = {
			/**
			 * Writes a string to stdin. It will be parsed after everything which has previously been written to stdin
			 *
			 * @param {String} str	The string to write
			 */
			write: stdin.write,
			/**
			 * Takes a look at the data in the stream
			 */
			peek: stdin.stream
		}

		// Out
		var stdout = new function() {
			// Data in the stream
			var stream = [];

			// Reads a single number from the stream
			this.read = function() {
				if (stream.length > 0) {
					return stream.shift();
				} else {
					throw new Error("No data available to read");
				}
			};

			// Check if data is available
			this.dataAvailable = function() {
				return stream.length > 0;
			};

			// Writes a number
			this.writeNumber = function(num) {
				stream.push(num);
				dispatchEvent("output", {data: num});
			};

			// Writes a character
			this.writeCharacter = function(num) {
				var char = String.fromCharCode(num);
				stream.push(char);
				dispatchEvent("output", {data: char});
			};

			// Returns the data in the stream as a string
			this.stream = function() {
				return stream.join();
			};
		};
		/**
		 * Perform operations on the output stream
		 */
		this.stdout = {
			/**
			 * Reads a token from stdout
			 *
			 * @return {String|Number}	A token of data
			 * @instance
			 */
			read: stdout.read,
			/**
			 * Checks if there are tokens to be read from the stream
			 *
			 * @return {boolean}	True if data can be read, false otherwise
			 * @instance
			 */
			dataAvailable: stdout.dataAvailable
		};

		// Currently string-parsing?
		var stringparsing = false;

		// Other properties
		Object.defineProperties(this, {
			/**
			 * True if the program has finished running, false otherwise
			 *
			 * @instance
	 		 * @memberof Fish.Parse
			 */
			ended: {get: function() {return started && !running;}},
			paused: {get: function() {return runTimeout == false;}},
			animated: {get: function() {return runTimeout == null && started}}
		});

		// Function to advance the IP
		function move(x, y) {
			var from = {char: ip.char, line: ip.line};
			if (typeof x != "undefined" && typeof y != "undefined") {
				if (x < 0 || y < 0) {
					error();
					return;
				}
				ip = {char: x, line: y};
			} else {
				switch (dir) {
					case "N":
						ip.line--;
						break;
					case "E":
						ip.char++;
						break;
					case "S":
						ip.line++;
						break;
					case "W":
						ip.char--;
						break;
				}
				ip.line = ip.line % codebox.height;
				ip.char = ip.char % codebox.width;
				if (ip.line < 0) {ip.line += codebox.height;}
				if (ip.char < 0) {ip.char += codebox.width;}

				if (typeof x != "undefined" && x === true && typeof y == "undefined") {
					dispatchEvent("moved", ip);
				}
			}
		};

		// Function to execute the instruction in the current cell
		function execute() {
			var instruction = codebox.getInstructionAt(ip);
			if (instruction === 0) {instruction = " ";}
			if (stringparsing != false && instruction != stringparsing) {
				stack.current.push(instruction.charCodeAt(0));
				stackchanged();
			} else if (stringparsing != false && instruction == stringparsing) {
				stringparsing = false;
			} else {
				switch (instruction) {
					// Movement changers
					case "^":
						dir = "N";
						break;
					case ">":
						dir = "E";
						break;
					case "v":
						dir = "S";
						break;
					case "<":
						dir = "W";
						break;
					case "x":
						dir = ["N", "E", "S", "W"][Math.floor(Math.random()*4)];
						break;
					// Mirrors
					case "/":	
						if (dir == "N") {dir = "E";}
						else if (dir == "E") {dir = "N";}
						else if (dir == "S") {dir = "W";}
						else if (dir == "W") {dir = "S";}
						break;
					case "\\":
						if (dir == "N") {dir = "W";}
						else if (dir == "E") {dir = "S";}
						else if (dir == "S") {dir = "E";}
						else if (dir == "W") {dir = "N";}
						break;
					case "|":
						if (dir == "E") {dir = "W";}
						else if (dir == "W") {dir = "E";}
						break;
					case "_":
						if (dir == "N") {dir = "S";}
						else if (dir == "S") {dir = "N";}
						break;
					case "#":
						if (dir == "N") {dir = "S";}
						else if (dir == "E") {dir = "W";}
						else if (dir == "S") {dir = "N";}
						else if (dir == "W") {dir = "E";}
						break;
					// Trampolines
					case "!":
						move();
						break;
					case "?":
						if (stack.current.pop() == 0) {
							move();
						}
						stackchanged();
						break;
					case ".":
						var y = stack.current.pop();
						var x = stack.current.pop();
						move(x, y);
						stackchanged();
						break;
					// Literals
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9":
					case "a":
					case "b":
					case "c":
					case "d":
					case "e":
					case "f":
						stack.current.push(parseInt(instruction, 16));
						stackchanged();
						break;
					// Operators
					case "+":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y + x);
						stackchanged();
						break;
					case "-":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y - x);
						stackchanged();
						break;
					case "*":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y * x);
						stackchanged();
						break;
					case ",":
						var x = stack.current.pop();
						var y = stack.current.pop();
						if (x == 0) {
							error();
						}
						stack.current.push(y / x);
						stackchanged();
						break;
					case "%":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y % x);
						stackchanged();
						break;
					case "=":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y == x ? 1 : 0);
						stackchanged();
						break;
					case ")":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y > x ? 1 : 0);
						stackchanged();
						break;
					case "(":
						var x = stack.current.pop();
						var y = stack.current.pop();
						stack.current.push(y < x ? 1 : 0);
						stackchanged();
						break;
					case "\"":
						stringparsing = "\"";
						break;
					case "'":
						stringparsing = "'";
						break;
					// Stack manipulation
					case ":":
						stack.current.duplicateTop();
						stackchanged();
						break;
					case "~":
						stack.current.removeTop();
						stackchanged();
						break;
					case "$":
						stack.current.swapTwo();
						stackchanged();
						break;
					case "@":
						stack.current.swapThree();
						stackchanged();
						break;
					case "}":
						stack.current.shiftRight();
						stackchanged();
						break;
					case "{":
						stack.current.shiftLeft();
						stackchanged();
						break;
					case "r":
						stack.current.reverse();
						stackchanged();
						break;
					case "l":
						stack.current.pushLength();
						stackchanged();
						break;
					case "[":
						stack.newStack();
						stackchanged();
						break;
					case "]":
						stack.removeStack();
						stackchanged();
						break;
					// I/O
					case "o":
						stdout.writeCharacter(stack.current.pop());
						stackchanged();
						break;
					case "n":
						stdout.writeNumber(stack.current.pop());
						stackchanged();
						break;
					case "i":
						stdin.read();
						stackchanged();
						dispatchEvent("inputconsumed");
						break;
					// Reflection/Misc
					case "&":
						stack.current.register();
						stackchanged();
						break;
					case "g":
						var y = stack.current.pop();
						var x = stack.current.pop();
						var code = codebox.getInstructionAt({char: x, line: y});
						if (typeof code == "string") {
							stack.current.push(code.charCodeAt(0));
						} else {
							stack.current.push(code);
						}
						stackchanged();
						break;
					case "p":	
						var y = stack.current.pop();
						var x = stack.current.pop();
						var v = String.fromCharCode(stack.current.pop());
						codebox.setInstructionAt({char: x, line: y}, v);
						dispatchEvent("codechanged", {location: {char: x, line: y}, newCode: v});
						stackchanged();
						break;
					case ";":
						self.stop();
						break;
					// NOP
					case " ":
						break;
					// Unknown char. Do nothing
					default:
						error();
						break;
				}
			}
		};

		/**
		 * Starts the execution of the program
		 *
		 * @param {Array} [initialStack]	Stack to start the program with. Acceps hexes on the form 0xabc, characters on the form
		 *					"a", octals on the form 047, and decimal floats and integers. Defaults to []
		 * @param {boolean} [animated]	True to make a delay between each instruction, false to have it execute immediately. Default: true
		 */
		this.start = function(initialStack, animated) {
			if (!started) {
				// Put on the initial stack
				if (initialStack instanceof Array) {
					while (initialStack.length > 0) {
						// Parse the item
						var item = initialStack.shift().trim();
						itemOrig = item;
						if (item.length >= 3 && item.charAt(0) == "0" && item.charAt(1) == "x") {
							// Hex number
							item = parseInt(item, 16);
						} else if (item.length >= 2 && item.charAt(0) == "0" && item.charAt(1) != ".") {
							// Octal number
							item = parseInt(item, 8);
						} else if (item.length > 3 && item.charAt(0) == '"' && item.charAt(item.length-1) == '"') {
							// A string
							item = item.split("").reverse().join("");
							for (var i = 1; i < item.length-1; i++) {
								initialStack.unshift('"' + item.charAt(i) + '"');
							}
							continue;
						} else if (item.length == 3 && item.charAt(0) == '"' && item.charAt(2) == '"') {
							// A character
							item = item.charCodeAt(1);
						} else {
							// A float
							if (item.match(/^[0-9.,]*$/) instanceof Array) {
								item = parseFloat(item);
							} else {
								item = NaN;
							}
						}
						if (isNaN(item)) {
							throw new Error("Invalid stack item: " + itemOrig);
						}
						stack.current.push(item);
					}
					stackchanged();
				}
				

				if (typeof animated == "undefined") {
					animated = true;
				}

				running = true;
				started = true;
				var func = animated ? runAnimated : runImmediate;
				setTimeout(func, 0);
			} else {
				throw new Error("Program already started");
			}
		};

		/**
		 * Pauses the program if it is running, resumes it if it is paused
		 */
		this.pauseResume = function() {
			if (runTimeout != null && !self.ended) {
				if (runTimeout != false) {
					clearTimeout(runTimeout);
					runTimeout = false;
					dispatchEvent("paused");
				} else {
					runAnimated();
					dispatchEvent("resumed");
				}
			}
		};

		/**
		 * Stop the program
		 */
		this.stop = function() {
			if (started) {
				running = false;
				clearTimeout(runTimeout);
				runTimeout = null;
				dispatchEvent("ended");
			}
		};

		// The "loop" itself, animated version
		function runAnimated() {
			move(true);
			try {
				execute();
			} catch (e) {
				error();
			}
			if (running) {
				runTimeout = setTimeout(runAnimated, 1000/speed);
			}
		};

		// The "loop" itself, immediate version
		function runImmediate() {
			while (running) {
				move(true);
				try {
					execute();
				} catch (e) {
					error();
				}
			}
		};

		// Function to dispatch events
		function dispatchEvent(type, data) {
			self.dispatchEvent(new CustomEvent(type, {detail: data}));
		};
	},
	/**
	 * Constructor for a stack handler
	 *
	 * @constructor
	 */
	StackHandler: function() {
		// Constructor for a stack
		function Stack() {
			// The actual stack
			var stack = [];

			// The register
			var register = null;

			// Manipulate the register
			this.register = function() {
				if (register === null) {
					register = this.pop();
				} else {
					this.push(register);
					register = null;
				}
			};

			// Push a value onto the stack
			this.push = function(val) {
				stack.push(val);
			};

			// Pop a value from the stack
			this.pop = function() {
				if (stack.length == 0) {
					throw new Error("something smells fishy...");
				} else {
					return stack.pop();
				}
			};

			// Duplicate the top value
			this.duplicateTop = function() {
				var a = this.pop();
				this.push(a);
				this.push(a);
			};

			// Remove the top value from the stack
			this.removeTop = function() {
				this.pop();
			};

			// Swaps the top two elements on the stack
			this.swapTwo = function() {
				var a = this.pop();
				var b = this.pop();
				this.push(a);
				this.push(b);
			};

			// Swap the top three elements on the stack
			this.swapThree = function() {
				var a = this.pop();
				var b = this.pop();
				var c = this.pop();
				this.push(a);
				this.push(c);
				this.push(b);
			};

			// Shifts the stack right
			this.shiftRight = function() {
				if (stack.length > 0) {
					stack.unshift(this.pop());
				}
			};

			// Shifts the stack left
			this.shiftLeft = function() {
				if (stack.length > 0) {
					this.push(stack.shift());
				}
			};

			// Reverses the stack
			this.reverse = function() {
				stack.reverse();
			};

			// Pushes the length of the stack onto the stack
			this.pushLength = function() {
				this.push(stack.length);
			};

			// Gets the value on an index in the stack
			this.get = function(i) {
				if (typeof stack[i] == "undefined") {
					return null;
				}
				return stack[i];
			};

			Object.defineProperties(this, {
				/**
				 * Size of the stack
				 *
				 * @instance
				 * @memberof Fish.StackHandler.Stack
				 */
				length: {get: function() {return stack.length;}}
			});

		};

		// Stack of stacks
		var stackStack = [new Stack()];

		// Reference to the current stack
		var currentStack = stackStack[0];
		Object.defineProperties(this, {
			/**
			 * The current stack
			 *
			 * @instance
			 * @memberof Fish.StackHandler#
			 */
			current: {get: function() {return currentStack;}}
		});

		/**
		 * Creates a new stack on top of the current stack
		 */
		this.newStack = function() {
			var n = currentStack.pop();
			if (n < 0) {	// XXX Reference implementation dows not appear to have thought about negative numbers here
				throw new Error("something smells fishy...");
			}

			var newStack = new Stack();
			for (var i = 0; i < n; i++) {
				newStack.push(currentStack.pop());
			}

			currentStack = newStack;
			stackStack.push(newStack);
		};

		/**
		 * Removes the topmost stack from the stackstack, pushing it's values onto the stack below
		 */
		this.removeStack = function() {
			if (stackStack.length == 0) {
				stackStack = [new Stack()];
				currentStack = stackStack[0];
			} else {
				var oldStack = stackStack.pop();
				currentStack = stackStack[stackStack.length-1];
				while (oldStack.length > 0) {
					currentStack.push(oldStack.pop());
				}
			}
		};
	}
};
