Template.fishProgramControls.onCreated(function() {
	// Get program from data
	this.program = this.data;

	// Make I/O vars
	this.stdin = new ReactiveVar("");
	this.stdout = new ReactiveVar("");
	this.stack = new ReactiveVar("");
	this.state = new ReactiveDict();
	this.state.set("speed", this.program.speed);
	this.state.set("paused", this.program.paused);
	this.state.set("started", this.program.started);
	this.state.set("ended", this.program.ended);
	this.state.set("error", false);

	// Event handlers for the program
	this.updateStdin = function() {
		this.stdin.set(this.program.stdin.peek());
	}.bind(this);
	this.updateStdout = function() {
		this.stdout.set(this.stdout.curValue + "" + this.program.stdout.read());
	}.bind(this);
	this.updateStack = function() {
		this.stack.set(this.program.stack.join(", "));
	}.bind(this);
	this.ended = function() {
		this.state.set("ended", this.program.finished);
		$("button[name=pause]").remove();
		$button = $("button[name=stop]");
		$button.prop("name", "return-to-code");
		$button.text("Return to code");
	}.bind(this);
	this.error = function(e) {
		this.state.set("error", e.detail);
	}.bind(this);

	// Function for starting the program
	this.start = function(stack, anim) {
		if (stack[0] == "") {
			stack = [];
		}

		this.registerEventListeners();

		try {
			this.program.start(stack, anim);
			$(".init").remove();
			this.state.set("started", true);
			if (!anim) {
				$(".anim-only").remove();
			}
		} catch (e) {
			this.unregisterEventListeners();
			Errors.throw(e.message);
		}
	}.bind(this);

	// Functions for setting up and tearing down event listeners on the program
	this.registerEventListeners = function(anim) {
		this.program.addEventListener("inputconsumed", this.updateStdin);
		this.program.addEventListener("stackchanged", this.updateStack);
		this.program.addEventListener("output", this.updateStdout);
		this.program.addEventListener("ended", this.ended);
		this.program.addEventListener("error", this.error);
	}.bind(this);
	this.unregisterEventListeners = function() {
		this.program.removeEventListener("inputconsumed", this.updateStdin);
		this.program.removeEventListener("output", this.updateStdout);
		this.program.removeEventListener("stackchanged", this.updateStack);
		this.program.removeEventListener("ended", this.ended);
		this.program.removeEventListener("error", this.error);
	}.bind(this);

	this.updateStdin();
});

Template.fishProgramControls.helpers({
	speed: function() {
		return Template.instance().program.speed;
	},
	currentSpeed: function() {
		return Template.instance().state.get("speed");
	},
	stdinData: function() {
		var stdin = Template.instance().stdin.get();
		if (stdin == "") {
			return "<empty>";
		} else {
			return stdin;
		}
	},
	stdinClass: function() {
		var stdin = Template.instance().stdin.get();
		if (stdin == "") {
			return "grayed-out";
		}
	},
	stdoutData: function() {
		var stdout = Template.instance().stdout.get();
		if (stdout == "") {
			return "<empty>";
		} else {
			return stdout;
		}
	},
	stdoutClass: function() {
		var stdout = Template.instance().stdout.get();
		if (stdout == "") {
			return "grayed-out";
		}
	},
	stackData: function() {
		var stack = Template.instance().stack.get();
		if (stack == "") {
			return "<empty>";
		} else {
			return stack;
		}
	},
	stackClass: function() {
		var stack = Template.instance().stack.get();
		if (stack == "") {
			return "grayed-out";
		}
	},
	pauseResume: function() {
		return Template.instance().state.get("paused") ? "Resume" : "Pause";
	},
	startedClass: function() {
		return Template.instance().state.get("started") ? "" : "hidden";
	},
	error: function() {
		return Template.instance().state.get("error");
	},
	errorClass: function() {
		return Template.instance().state.get("error") ? "error" : "hidden";
	}
});

Template.fishProgramControls.events({
	"input input[name=speed-control]": function(e, t) {
		t.program.speed = $(e.target).val();
		t.state.set("speed", $(e.target).val());
	},
	"click button[name=start-control]": function(e, t) {
		var stack = $("[name=initial-stack-control]").val().split(",");
		t.start(stack, true);
	},
	"click button[name=start-no-anim-control]": function(e, t) {
		var stack = $("[name=initial-stack-control]").val().split(",");
		t.start(stack, false);
	},
	"click button[name=submit-input]": function(e, t) {
		if (t.state.get("ended") == false) {
			var $input = $("[name=stdin]");
			t.program.stdin.write($input.val());
			$input.val("");
			t.updateStdin();
		}
	},
	"click button[name=pause]": function(e, t) {
		t.program.pauseResume();
		t.state.set("paused", program.paused);
	},
	"click button[name=stop]": function(e, t) {
		t.program.stop();
	},
	"click button[name=return-to-code]": function() {
		Session.set("codeSubmitted", false);
	}
});


Template.fishProgramControls.onDestroyed(function() {
	// Clean up
	this.unregisterEventListeners();
});
