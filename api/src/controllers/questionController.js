const questionService = require('../services/questionService');

const questionController = {
  async importQuestions(req, res) {
    try {
      const importedQuestions = await questionService.importQuestionsFromCSV();
      res.json({
        message: 'Perguntas importadas com sucesso',
        count: importedQuestions.length,
        questions: importedQuestions
      });
    } catch (error) {
      console.error('Error importing questions:', error);
      res.status(500).json({ 
        error: 'Erro ao importar perguntas',
        details: error.message 
      });
    }
  },

  async getProjectQuestions(req, res) {
    try {
      const { projectId } = req.params;
      const answers = await questionService.getProjectQuestionAnswers(projectId);
      const formatted = questionService.formatAnswersForCards(answers);
      res.json(formatted);
    } catch (error) {
      console.error('Error fetching project questions:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar perguntas do projeto',
        details: error.message 
      });
    }
  },

  async listQuestions(req, res) {
    try {
      const questions = await questionService.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error('Error listing questions:', error);
      res.status(500).json({ 
        error: 'Erro ao listar perguntas',
        details: error.message 
      });
    }
  }
};

module.exports = questionController;
