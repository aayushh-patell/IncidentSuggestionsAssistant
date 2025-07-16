require 'net/http'
require 'json'
require 'rails'

class GeminiClient
  GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

  # Initialize with API key
  def initialize(api_key = ENV['GEMINI_API_KEY'])
    @api_key = api_key
  end

  # Main method: extract suggestions from transcript context and previous suggestions
  def extract_suggestions(context_window, previous_suggestions = [])
    # Build previous suggestions section for the prompt
    previous_suggestions_section = if previous_suggestions.any?
      """
        Previous suggestions (DO NOT repeat, rephrase, or restate any of these):
        #{previous_suggestions.map { |s| "- \"#{s}\"" }.join("\n")}
      """
    else
      ""
    end

    # Construct the LLM prompt with deduplication rules and examples
    prompt = <<~PROMPT
      Given the following incident transcript, extract suggestions that are actionable, novel, and important for incident response.

      STRICT DEDUPLICATION RULES:
      - DO NOT return any suggestion that is a duplicate, near-duplicate, rephrasing, or restatement of any previous suggestion, even if the wording is different.
      - DO NOT split the same action into multiple suggestions. Only return the most concise, clear, and unique version of each action.
      - If two suggestions are about the same action, only return the best, most specific one.
      - If you are unsure if a suggestion is too similar to a previous one, DO NOT include it.
      - If a suggestion is already covered by a previous suggestion, DO NOT include it.
      - Only return suggestions that are truly unique and not covered by any previous suggestion.

      #{previous_suggestions_section}

      Transcript:
      #{context_window.map.with_index { |c, i| "#{i+1}. #{c}" }.join("\n")}

      For each suggestion, return:
      - type: One of "action_item", "root_cause", or "trigger_event". Only use "metadata" if there is truly no action, root cause, or trigger event.
      - title: A concise, 1-3 word summary of the suggestion. This must NOT be a duplicate or near-duplicate of the description or referenced_message. Make it specific and meaningful.
      - description: A short, user-facing, specific summary of the suggestion.
      - referenced_message: The message text or index that supports the suggestion.

      **Good Example:**
      [
        { "type": "action_item", "title": "Rollback Playbook", "description": "Update the rollback playbook to reflect the new deployment pipeline.", "referenced_message": "Okay, found the rollback playbook. It's in Confluence, but it looks... really outdated." },
        { "type": "root_cause", "title": "Database Spike", "description": "Postgres database CPU is at 100%, likely due to a new query pattern after deploy #341.", "referenced_message": "Whoa — 100% CPU on postgres." }
      ]

      **Bad Example:**
      - { "type": "metadata", "title": "Error Rate", "description": "Error rate on the web tier has spiked.", "referenced_message": "Error rate on the web tier has spiked." }
      - { "type": "metadata", "title": "Check the logs", "description": "Check the logs.", "referenced_message": "Users can't even load the homepage." }

      Only return a JSON array of objects as shown in the Good Example. Do NOT use Markdown code fences, do NOT return a string, and do NOT return an array of strings.

      Only return an empty array if there is truly nothing actionable, novel, or useful in the transcript.
    PROMPT

    # Prepare request body for Gemini API
    body = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    }

    # Set up HTTP request to Gemini API
    uri = URI("#{GEMINI_API_URL}?key=#{@api_key}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = body.to_json

    # Send request and get response
    response = http.request(request)

    # Parse LLM response JSON
    json = JSON.parse(response.body)
    text = json.dig("candidates", 0, "content", "parts", 0, "text")
    begin
      # Remove Markdown code fences if present, then parse JSON
      clean_text = text.gsub(/```json|```/, '').strip if text
      JSON.parse(clean_text)
    rescue => e
      # If parsing fails, return the raw text in an array for debugging
      text ? [text] : []
    end
  end
end
