Template.fishCodemaker.onCreated(function() {
	this.description = new ReactiveVar("");
	this.filter = new ReactiveVar("");
});

Template.fishCodemaker.helpers({
	code: function() {
		if (this.code) {
			return this.code;
		} else {
			return Session.get("code");
		}
	},
	codes: function() {
		return Code.find({
			visibility: "public",
			title: new RegExp(Template.instance().filter.get(), "i")
		}, {
			sort: {
				title: 1
			}
		});
	},
	description: function() {
		description = this.description ? this.description : Template.instance().description.get();
		return description;
	}
});

Template.fishCodemaker.events({
	"click button[data-rel=submit]": function() {
		var code = $("textarea").val();
		if (code.length > 0) {
			Session.set("code", code);
			Session.set("codeSubmitted", true);
		}
	},
	"click button[data-rel=save]": function() {
		Router.go("fishSave");
	},
	"input textarea": function(e, t) {
		var code = $(e.target).val();
		Session.set("code", code);
		Router.go("playground");
	},
	"input input[name=filter]": function(e, t) {
		t.filter.set($(e.target).val());
	}
});

Template.fishCodeSnippet.events({
	"click strong": function(e) {
		Router.go("playground", this);
	}
});
