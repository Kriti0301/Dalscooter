import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import userpool from "../../aws/cognitoConfig";
import { toast } from "react-toastify";
import { Roles } from "../../constants/AccessConstants";
import { storeUserDetailsInDynamoDB } from "../../api/authService";
import { User } from "lucide-react";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .matches(
      /[!@#$%^&*]/,
      "Password must contain at least one special character"
    )
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
  shiftKey: Yup.string()
    .required("Shift Key is required")
    .matches(/^[1-9][0-9]*$/, "Shift Key must be a positive number")
    .transform((value, originalValue) => {
      const num = parseInt(originalValue, 10);
      const mod = ((num - 1) % 26) + 1; // Ensure range 1–26
      return mod.toString(); // Convert back to string
    }),
  securityAnswer: Yup.string()
    .min(2, "Security answer must be at least 2 characters")
    .required("Security answer is required"),
});

export const Register = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    shiftKey: "",
    securityAnswer: "",
  };

  // Check if User or Franchise
  useEffect(() => {
    if (
      type !== Roles.USER.toLowerCase() &&
      type !== Roles.FRANCHISE.toLowerCase()
    )
      navigate("/unauthorized");
  }, [type]);
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const attributeList = [];

      console.log("Form submitted:", {
        email: values.email,
        password: values.password,
        shiftKey: values.shiftKey,
      });

      attributeList.push(
        new CognitoUserAttribute({
          Name: "email",
          Value: values.email,
        }),
        new CognitoUserAttribute({
          Name: "custom:role",
          Value: type,
        }),
        new CognitoUserAttribute({
          Name: "name",
          Value: values.name,
        })
      );

      const username = values.email;

      userpool.signUp(
        username,
        values.password,
        attributeList,
        null,
        async (err, data) => {
          if (err) {
            toast.error("Registration Failed.", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            console.log(err);
            setSubmitting(false);
          } else {
            toast.success("Registration Successful", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            console.log(data);

            const res = await storeUserDetailsInDynamoDB({
              email: values.email,
              name: values.name,
              type,
              securityAnswer: values.securityAnswer,
              shiftKey: values.shiftKey.toString(),
              role: type === Roles.FRANCHISE ? "1" : "0",
            });
            console.log(res);
            navigate("/verify", { state: { username: values.email } });
            setSubmitting(false);
          }
        }
      );
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    return type === Roles.USER.toLowerCase()
      ? "User Registration"
      : "Franchise Registration";
  };

  const getAlternateRoute = () => {
    return type === Roles.USER.toLowerCase()
      ? `/register/${Roles.FRANCHISE.toLowerCase()}`
      : `/register/${Roles.USER.toLowerCase()}`;
  };

  const getAlternateText = () => {
    return type === Roles.USER.toLowerCase()
      ? "Franchise Signup"
      : "User Signup";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-8 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Join Dal scooter</h2>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            Create your account to access our secure fleet management system.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <Field
                    type="text"
                    name="name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.name && touched.name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.email && touched.email
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.password && touched.password
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <Field
                    type="password"
                    name="confirmPassword"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.confirmPassword && touched.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Shift Key Field */}
                <div>
                  <label
                    htmlFor="shiftKey"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Shift Key
                  </label>
                  <Field
                    type="number"
                    name="shiftKey"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.shiftKey && touched.shiftKey
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your shift key"
                  />
                  <ErrorMessage
                    name="shiftKey"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Security Question */}
                <div>
                  <label
                    htmlFor="securityAnswer"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Security Question
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    What’s your favorite movie?
                  </p>
                  <Field
                    type="text"
                    name="securityAnswer"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.securityAnswer && touched.securityAnswer
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your answer"
                  />
                  <ErrorMessage
                    name="securityAnswer"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>

                {/* Navigation Links */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <button
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      type="button"
                      onClick={() => navigate("/")}
                    >
                      ← Back to Home
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      type="button"
                      onClick={() => navigate(getAlternateRoute())}
                    >
                      {getAlternateText()}
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="text-gray-600">
                      Already have an account?{" "}
                    </span>
                    <a
                      href="/login/user"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Sign in here
                    </a>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};
