_.Module({
	
required:[
	'modules/splice.controls.js',
	'../examples/Controls/controlsdemoapplication.htmlt'
],

definition:function(){


	var ControlsDemoApplication = _.Namespace('UserApplications').Class(function ControlsDemoApplication(){

	});

	ControlsDemoApplication.prototype.onDisplay = function(){

		this.ref.scrollPanel.reflow();

	};


}});