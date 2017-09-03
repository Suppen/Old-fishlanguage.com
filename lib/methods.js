Meteor.methods({
	saveCode: function(title, description, visibility, code) {
		if (Meteor.userId()) {
			check(title, String);
			check(description, String);
			check(visibility, String);
			check(code, String);

			var _id = Code.insert({
				title: title,
				description: description,
				visibility: visibility,
				code: code,
				authorId: Meteor.userId(),
				author: Meteor.user().username,
				created: new Date(),
				rand: Math.random()
			});

			return {_id: _id};
		}
	}
});
