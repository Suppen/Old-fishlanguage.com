Template.userProfile.helpers({
	ownProfile: function() {
		return Meteor.userId() == this.authorId;
	},
	hasSubmittedCode: function() {
		return this.code.count();
	}
});

Template.userProfile.events({
	"click li b": function(e) {
		Router.go("playground", this);
	},
	"click li .delete": function(e) {
		var _id = this._id;
		var title = this.title;
		bootbox.confirm("Are you sure you want to delete the program \"" + title + "\"?", function(result) {
			if (result) {
				Code.remove(_id);
			}
		});
	}
});
