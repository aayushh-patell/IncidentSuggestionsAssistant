class TranscriptMessage < ApplicationRecord
  belongs_to :incident
  has_many :suggestions, dependent: :destroy
end 