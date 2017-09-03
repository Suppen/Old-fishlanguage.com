Template.playground.created = function() {
	if (this.data) {
		Session.set("code", this.data.code);
	}
	Session.set("codeSubmitted", false);
};

Template.playground.helpers({
	code: function() {
		return Session.get("code");
	},
	codeSubmitted: function() {
		return Session.get("codeSubmitted") && Session.get("code") != "";
	}
});

Template.playground.destroyed = function() {
	Session.set("codeSubmitted", null);
};
