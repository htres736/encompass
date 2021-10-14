import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class MetricsProblemController extends Controller {
  @tracked showWorkspaces = false;
  @tracked showProblemText = false;
  @tracked showAnswers = false;
  @tracked relevantWorkspaces = [];
  @tracked problemAnswers = [];
  workspacesHead = [
    { name: 'Name', valuePath: 'name' },
    { name: 'Owner', valuePath: 'owner' },
    { name: 'Submissions', valuePath: 'submissionsLength' },
    { name: 'Comments', valuePath: 'commentsLength' },
    { name: 'Selections', valuePath: 'selectionsLength' },
    { name: 'Responses', valuePath: 'responsesLength' },
  ];
  @action toggleProblemText() {
    this.showProblemText = !this.showProblemText;
    this.showWorkspaces = false;
    this.showAnswers = false;
  }
  @action findWorkspaces() {
    this.showAnswers = false;
    this.showWorkspaces = true;
    this.showProblemText = false;
  }
  @action findWorkspaces2() {
    this.store
      .query('workspace', {
        filterBy: {
          'submissionSet.criteria.puzzle.puzzleId': this.model.puzzleId,
        },
      })
      .then((res) => {
        this.relevantWorkspaces = res;
        this.showAnswers = false;
        this.showWorkspaces = true;
        this.showProblemText = false;
      });
  }
  @action findSubmissions() {
    this.store
      .query('answer', {
        filterBy: {
          problem: this.model.id,
        },
        didConfirmLargeRequest: true,
      })
      .then((res) => {
        this.problemAnswers = res;
        this.showAnswers = true;
        this.showWorkspaces = false;
        this.showProblemText = false;
      });
  }
}
