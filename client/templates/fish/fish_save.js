Template.fishSave.created = function() {
	this.program = new Fish.Parse(Session.get("code"));
};

Template.fishSave.helpers({
	program: function() {
		return Template.instance().program;
	}
});

Template.fishSave.events({
	"submit form": function(e) {
		e.preventDefault();

		var title = $("#fish-save-title").val();
		var description = $("#fish-save-description").val();
		var code = Session.get("code");
		var visibility = $("input[name=visibility]:checked").val();

		Meteor.call("saveCode", title, description, visibility, code, function(err, res) {
			if (err) {
				$("#fish-save-title").prop("disabled", false);
				$("#fish-save-description").prop("disabled", false);
				$("input[type=submit]").prop("disabled", false);
			} else {
				Router.go("playground", res);
			}
		});

		$("#fish-save-title").prop("disabled", "disabled");
		$("#fish-save-description").prop("disabled", "disabled");
		$("input[type=submit]").prop("disabled", "disabled");
	}
});
