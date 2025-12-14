class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :bookings, dependent: :nullify

  # Enums
  enum :role, { guest: 0, staff: 1, manager: 2, admin: 3 }

  # Validations
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true

  # Callbacks
  after_initialize :set_default_role, if: :new_record?
  before_create :generate_auth_token

  # Методы для auth token
  def generate_auth_token
    loop do
      self.auth_token = SecureRandom.urlsafe_base64(32)
      break unless User.exists?(auth_token: auth_token)
    end
  end

  def regenerate_auth_token!
    generate_auth_token
    save!
  end

  private

  def set_default_role
    self.role ||= :guest
  end
end
