class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :bookings, dependent: :nullify

  # Enums
  enum :role, { staff: 0, manager: 1, admin: 2 }

  # Validations
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true

  # Callbacks
  after_initialize :set_default_role, if: :new_record?

  private

  def set_default_role
    self.role ||= :staff
  end
end
