class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :bookings, dependent: :nullify
  has_many :auth_tokens, dependent: :destroy

  # Enums
  enum :role, { guest: 0, staff: 1, manager: 2, admin: 3, analytics: 4 }
  
  # Validations
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true

  # Callbacks
  after_initialize :set_default_role, if: :new_record?

  # Auth token methods for multiple sessions
  def create_auth_token!(device_info: nil)
    auth_tokens.create!(device_info: device_info)
  end
  
  def find_auth_token(token)
    auth_tokens.active.by_token(token).first
  end

  private

  def set_default_role
    self.role ||= :guest
  end
end
