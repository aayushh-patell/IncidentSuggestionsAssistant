class Suggestion < ApplicationRecord
  belongs_to :transcript_message
  belongs_to :incident

  enum :suggestion_type, {
    action_item: 0,
    trigger_event: 1,
    root_cause: 2,
    metadata: 3
  }

  require 'fuzzy_match'

  def self.is_novel_and_valuable?(suggestion, incident)
    recent = incident.suggestions
    desc = suggestion["description"].to_s.downcase.strip
    return false if desc.length < 10
    # Exact match check
    return false if recent.any? { |s| s.description.to_s.downcase.strip == desc }
    # Fuzzy match check (looser threshold)
    recent_descs = recent.map { |s| s.description.to_s.downcase.strip }
    fuzzy = FuzzyMatch.new(recent_descs)
    best_match, score = fuzzy.find_best(desc)
    # Use a higher similarity threshold (e.g., 0.90)
    if best_match && score && score >= 0.95
      return false
    end
    true
  end

  def as_json(options = {})
    super({
      only: [:id, :title, :description, :suggestion_type, :content, :transcript_message_id, :incident_id, :created_at, :updated_at]
    }.merge(options))
  end
end 