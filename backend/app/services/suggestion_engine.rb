class SuggestionEngine
    def initialize(transcript_message)
      @message = transcript_message
    end
  
    def call
      context = TranscriptMessage.where(incident: @message.incident).order(:created_at).last(7)
      context_texts = context.map(&:content)
      # Gather last 10 suggestion descriptions for this incident
      previous_suggestions = @message.incident.suggestions.order(created_at: :desc).limit(10).pluck(:description)
      gemini = GeminiClient.new
      suggestions = gemini.extract_suggestions(context_texts, previous_suggestions)
      suggestions.each do |suggestion|
        if suggestion.is_a?(Hash)
          next unless Suggestion.is_novel_and_valuable?(suggestion, @message.incident)
          # Find the referenced message
          referenced = context.find { |msg| suggestion["referenced_message"]&.include?(msg.content[0, 30]) }
          referenced ||= @message # fallback to current message
          next unless referenced # Only create if we can match
          create_suggestion(suggestion["type"], suggestion["title"], suggestion["description"], referenced)
        elsif suggestion.is_a?(String)
          # Fallback: treat as metadata suggestion for current message
          next unless Suggestion.is_novel_and_valuable?({"description" => suggestion}, @message.incident)
          create_suggestion("metadata", nil, suggestion, @message)
        end
      end
    end
  
    private
  
    def create_suggestion(kind, title, description, referenced_message)
      # Map kind string to enum symbol
      type_map = {
        "Action Item" => :action_item,
        "Trigger Event" => :trigger_event,
        "Root Cause" => :root_cause,
        "Missing Metadata" => :metadata,
        "action_item" => :action_item,
        "trigger_event" => :trigger_event,
        "root_cause" => :root_cause,
        "metadata" => :metadata
      }
      suggestion = Suggestion.create!(
        incident: referenced_message.incident,
        transcript_message: referenced_message,
        suggestion_type: type_map[kind] || :metadata,
        title: title,
        description: description,
        content: referenced_message.content
      )
      # Broadcast to ActionCable
      ActionCable.server.broadcast("suggestions", suggestion.as_json)
    end
  end
  