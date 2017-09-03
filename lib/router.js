Router.configure({
	layoutTemplate: "layout",
	loadingTemplate: "loading",
	notFoundTemplate: "notFound"
});

Router.route("/profile/:_id", {
	name: "profile",
	template: "userProfile",
	waitOn: function() {
		return Meteor.subscribe("usersCode", this.params._id);
	},
	data: function() {
		var user = Meteor.users.findOne(this.params._id);
		if (user) {
			user.code = Code.find({authorId: this.params._id});
		}
		return user;
	}
});

Router.route("/playground/:_id?", {
	name: "playground",
	waitOn: function() {
		return [Meteor.subscribe("randomcode"), Meteor.subscribe("thiscode", this.params._id)];
	},
	data: function() {
		var code = Code.findOne(this.params._id, {fields: {code: 1, description: 1}});
		if (this.params._id && !code) {
			code = {code: "Code not found", _id: this.params._id, description: null};
		}
		return code;
	}
});

Router.route("/save", {
	name: "fishSave"
});

Router.route("/", {
	name: "home",
	action: function() {
		this.redirect("/playground");
	}
});
