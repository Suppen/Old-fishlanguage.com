Template.fishProgram.created = function() {
	// Create the program. The code should be in this.data
	this.program = new Fish.Parse(this.data);
};

Template.fishProgram.helpers({
	program: function() {
		return Template.instance().program;
	}
});
