Template.layout.events({
	"click a[data-rel=logout]": function() {
		Meteor.logout();
	}
});
