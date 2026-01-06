class AuthToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expires_at, on: :create

  scope :active, -> { where('expires_at > ?', Time.current) }
  scope :by_token, ->(token) { where(token: token) }

  def self.generate_token
    SecureRandom.hex(32)
  end

  def expired?
    expires_at < Time.current
  end

  def self.cleanup_expired
    where('expires_at < ?', Time.current).delete_all
  end

  private

  def generate_token
    self.token ||= self.class.generate_token
  end

  def set_expires_at
    self.expires_at ||= 30.days.from_now
  end
end
