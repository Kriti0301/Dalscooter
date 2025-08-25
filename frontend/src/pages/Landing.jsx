import React, { useState } from 'react';
import { MapPin, Zap, Clock, Shield, Menu, X, Play, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DalScooterLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: MapPin,
      title: 'Find Nearby Scooters',
      description: 'Locate available scooters on our interactive map with real-time availability updates.'
    },
    {
      icon: Zap,
      title: 'Quick Start',
      description: 'Unlock and start your ride in seconds.'
    },
    {
      icon: Clock,
      title: 'Flexible Trips',
      description: 'Start and end your trip anywhere within our service area. Pay only for the time you ride.'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Built-in safety features, GPS tracking, and 24/7 customer support for peace of mind.'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '1M+', label: 'Trips Completed' },
    { number: '25+', label: 'Cities Served' },
    { number: '4.8', label: 'App Rating' }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Sign Up',
      description: 'Create your account and verify your identity in minutes'
    },
    {
      step: '2',
      title: 'Find a Scooter',
      description: 'Use the map to locate the nearest available scooter'
    },
    {
      step: '3',
      title: 'Start Riding',
      description: 'Scan the QR code to unlock and begin your trip'
    },
    {
      step: '4',
      title: 'End Trip',
      description: 'Park responsibly and end your trip through the app'
    }
  ];

  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Zap className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">DalScooter</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">How It Works</a>
                <a href="/reviews" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Reviews</a>
                <button onClick={()=>navigate('/register/user')} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Sign up
                </button>
              </div>
            </div>
            
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#reviews" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Reviews</a>
              <button onClick={()=>navigate('/register/user')} className="w-full text-left bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                Sign up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Your City,
                <br />
                <span className="text-blue-600">Your Ride</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Experience the freedom of electric scooter sharing. Find, unlock, and ride with DalScooter - the smartest web platform to get around your city.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button onClick={()=>navigate('/register/user')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                  Sign up
                </button>
                <button onClick={()=>navigate('/login/user')} className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors flex items-center justify-center">
                  Sign in
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-100 rounded-2xl p-8 h-96 flex items-center justify-center relative overflow-hidden">
                {/* Phone mockup */}
                <div className="bg-white rounded-3xl p-4 shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-300">
                  <div className="bg-gray-900 rounded-2xl p-6 w-48 h-80">
                    <div className="bg-blue-600 rounded-xl p-4 mb-4">
                      <MapPin className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-800 rounded h-3 w-3/4"></div>
                      <div className="bg-gray-800 rounded h-3 w-1/2"></div>
                      <div className="bg-gray-800 rounded h-3 w-5/6"></div>
                    </div>
                    <div className="mt-6 bg-blue-600 rounded-lg p-3 text-center">
                      <span className="text-white text-sm font-semibold">Start Ride</span>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg animate-bounce">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="absolute bottom-6 left-6 bg-white rounded-full p-2 shadow-lg animate-pulse">
                  <MapPin className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DalScooter?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built the most reliable and user-friendly web platform for scooter sharing to make your urban mobility seamless and enjoyable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Getting started with DalScooter web platform is simple and straightforward
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Connecting line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-200 z-0" style={{width: 'calc(100% - 2rem)'}}></div>
                )}
                <div className="relative z-10">
                  <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg hover:shadow-xl transition-shadow">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Riders Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "DalScooter has completely changed how I get around the city. The web platform is super intuitive and the scooters are always reliable. Perfect for my daily commute!"
              </p>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Chen</div>
                  <div className="text-gray-500 text-sm">Marketing Manager</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "As a student, DalScooter is a lifesaver. The student discount makes it super affordable, and I can get to campus in minutes instead of waiting for the bus."
              </p>
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike Rodriguez</div>
                  <div className="text-gray-500 text-sm">University Student</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "I love how eco-friendly and convenient DalScooter is. The GPS tracking gives me peace of mind, and customer support is always helpful when I need assistance."
              </p>
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Emily Johnson</div>
                  <div className="text-gray-500 text-sm">Software Developer</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Review stats */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center bg-white px-6 py-4 rounded-full shadow-sm">
              {/* <div className="flex items-center mr-6">
                <Star className="h-6 w-6 text-yellow-400 fill-current mr-2" />
                <span className="text-2xl font-bold text-gray-900">4.8</span>
                <span className="text-gray-600 ml-2">average rating</span>
              </div> */}
              <div className="border-l border-gray-200 pl-6">
                <button onClick={()=>navigate('/reviews')} className="text-xl font-bold text-gray-800">Checkout customer reviews</button>
                {/* <span className="text-gray-600 ml-2">happy customers</span> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Riding?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of riders who have already discovered the convenience of DalScooter. Launch the web platform and take your first ride today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={()=>navigate('/register/user')} className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Sign up
            </button>
            <button onClick={()=>navigate('/login/user')} className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">DalScooter</span>
              </div>
              <p className="text-gray-400">
                Making urban mobility accessible, sustainable, and fun for everyone.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cities</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issue</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DalScooter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}