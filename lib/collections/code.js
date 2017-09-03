Code = new Meteor.Collection("code");

Code.allow({
	remove: function(userId, doc) {
		return userId == doc.authorId;
	}
});
