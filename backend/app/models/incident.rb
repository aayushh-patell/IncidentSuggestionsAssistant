class Incident < ApplicationRecord
  has_many :transcript_messages, dependent: :destroy
  has_many :suggestions, dependent: :destroy
end 