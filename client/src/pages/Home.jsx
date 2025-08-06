import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  FileText, 
  CreditCard, 
  Users, 
  BarChart3, 
  Zap,
  Star,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Proposals',
      description: 'Generate professional proposals in seconds with our smart AI assistant that understands your business.'
    },
    {
      icon: CreditCard,
      title: 'Invoice & Payments',
      description: 'Track payments, send invoices, and manage your finances all in one integrated platform.'
    },
    {
      icon: BarChart3,
      title: 'Project Management',
      description: 'Visual project tracking with timelines, milestones, and automated client updates.'
    },
    {
      icon: Users,
      title: 'Client Portal',
      description: 'Give clients secure access to project updates, files, and communication history.'
    },
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Streamline repetitive tasks with intelligent automation and email sequences.'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Store, organize, and share all your project documents and contracts securely.'
    }
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increase Revenue',
      description: 'Close more deals with professional proposals and streamlined processes',
      stat: '40% faster'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Automate repetitive tasks and focus on what you do best',
      stat: '10+ hours/week'
    },
    {
      icon: Shield,
      title: 'Stay Organized',
      description: 'Never lose track of projects, clients, or deadlines again',
      stat: '100% organized'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Freelance Designer',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      quote: 'FreelanceFlow transformed my business. The AI proposals are incredible and save me hours every week.'
    },
    {
      name: 'Mike Chen',
      role: 'Consultant',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      quote: 'Finally, a platform that understands freelancers. Everything I need in one place.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Content Creator',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      quote: 'The client portal feature alone has improved my client relationships dramatically.'
    }
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="gradient-bg py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  The Ultimate Workflow OS for{' '}
                  <span className="text-green-500">Freelancers</span>{' '}
                  & Solo Creators
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 max-w-2xl">
                  Manage your entire client journey from proposal to payment in one seamless platform. 
                  Built specifically for solo professionals who want agency-level tools.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 ">
                <Link
                  to={isAuthenticated ? "/proposal-generator" : "/register"}
                  className="btn-primary inline-flex text-center group"
                >
                  {isAuthenticated ? 'Generate Proposal' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="btn-secondary text-center">
                  Learn More
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10k+</div>
                  <div className="text-sm text-gray-600">Freelancers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$2M+</div>
                  <div className="text-sm text-gray-600">Proposals Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="relative p-8 animate-float">
                <img
                  src="3D-Hero.gif"
                  alt="Professional freelancer working"
                  className="w-full h-96 object-cover rounded-xl"
                />
                <div className="absolute -top-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-semibold">AI-Powered</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-12 -left-8 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Proposal Accepted!</span>
                </div>
              </div>
              
              <div className="absolute bottom-12 -right-8 bg-white p-4 rounded-lg shadow-lg">
                <div className="text-sm text-gray-600">This month</div>
                <div className="text-2xl font-bold text-primary-600">$12,450</div>
                <div className="text-sm text-green-600">+23% increase</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built for Your Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your freelance business like a pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 mb-4">{benefit.description}</p>
                  <div className="text-2xl font-bold text-primary-600">{benefit.stat}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From proposals to payments, we've got your entire workflow covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card group hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                About <span className="text-gradient">FreelanceFlow</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Empowered Independence</h3>
                    <p className="text-gray-600">
                      At FreelanceFlow, we believe solo professionals deserve a platform as powerful 
                      as a full agency dashboard—without the complexity.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Seamless Management</h3>
                    <p className="text-gray-600">
                      Our platform brings together every essential tool in one seamless system: 
                      from creating proposals to tracking invoices to visual project management.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Future Ready</h3>
                    <p className="text-gray-600">
                      FreelanceFlow is built with the future of work in mind—where flexibility, 
                      automation, and client satisfaction are key.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2"
                alt="Professional workspace"
                className="rounded-xl shadow-lg"
              />
              <img
                src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2"
                alt="Creative workspace"
                className="rounded-xl shadow-lg mt-8"
              />
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2"
                alt="Modern office"
                className="rounded-xl shadow-lg -mt-8"
              />
              <img
                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2"
                alt="Freelancer at work"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Loved by Freelancers Worldwide
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of successful freelancers who trust FreelanceFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Freelance Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of freelancers who have streamlined their workflow with FreelanceFlow. 
            Start with a free proposal today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? "/proposal-generator" : "/register"}
              className="bg-white text-primary-600 hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {isAuthenticated ? 'Generate Your First Proposal' : 'Start Free Trial'}
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home