class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :first_name, :last_name, :role, :created_at, :updated_at, :last_sign_in_at

  def last_sign_in_at
    object.last_sign_in_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end

  def updated_at
    object.updated_at.iso8601
  end
end
