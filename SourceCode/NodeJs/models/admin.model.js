require('dotenv').config();

module.exports = mongoose => {
    const schema = mongoose.Schema(
        {
            _id: String,
            username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
            password: { type: String, required: true, minlength: 5, maxlength: 1024 },
        },
        { timestamps: true }
    );
    const admin = mongoose.model("admin", schema);
    return admin;
};
