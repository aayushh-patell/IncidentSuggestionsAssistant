class Api::SuggestionsController < ApplicationController
  def index
    @suggestions = Suggestion.order(:created_at)
    render json: @suggestions
  end
end
