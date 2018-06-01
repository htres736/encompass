/**
 * # Workspaces New Controller
 * @description This controller for creating a new workspace
 * @author Damola Mabogunje <damola@mathforum.org>
 * @since 1.0.1
 */

Encompass.ProblemController = Ember.Controller.extend(Encompass.CurrentUserMixin, {
    actions: {
        radioSelect: function (value) {
            this.set('isPublic', value);
        },

        createProblem: function () {
            var controller = this;
            console.log('Create Problem is called');
            var createProblemData = this.store.createRecord('problem', {
                createdBy: this.get('currentUser'),
                createDate: new Date(),
                title: this.get('title'),
                text: this.get('text'),
                categories: this.get('categories'),
                additionalInfo: this.get('additionalInfo'),
                isPublic: this.get('isPublic'),
            });
            createProblemData.save();
            console.log('Problem Data: ' + createProblemData);

            // var request = this.store.createRecord('problem', createProblemData);
            // var output;

            // request.save().then(function (obj) {
            //     var result = obj.get('results');
            //     console.log('it worked!');
            //     console.log(result);
            //     var output = `Problem name: ${result}!`;
            //     controller.transitionToRoute('index');
            // });

        }
    }
});
