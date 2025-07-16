class Api::IncidentsController < ApplicationController
  def index
    @incidents = Incident.all
    render json: @incidents
  end

  def show
    @incident = Incident.find(params[:id])
    render json: @incident.as_json(include: { 
      transcript_messages: { 
        include: :suggestions 
      }
    })
  end
end
