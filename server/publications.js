Meteor.publish("randomcode", function() {
	return Code.find({visibility: "public"});
});

Meteor.publish("thiscode", function(_id) {
	return Code.find({
		_id: _id,
		$or: [
			{
				$or: [
					{
						visibility: "public"
					},
					{
						visibility: "link"
					}
				]
			},
			{
				visibility: "private",
				authorId: this.userId
			}
		]
	});
});

Meteor.publish("usersCode", function(_id) {
	var user = Meteor.users.find(_id, {fields: {username: 1, createdAt: 1}});
	var code = Code.find({
		authorId: _id,
		$or: [
			{
				visibility: "public"
			},
			{
				authorId: this.userId
			}
		]
	});
	return [user, code];
});
