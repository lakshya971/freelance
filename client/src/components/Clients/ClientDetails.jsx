import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  MapPin,
  Edit,
  FileText,
  Receipt,
  FolderKanban,
  DollarSign
} from "lucide-react";
import { Proposal } from "@/entities/Proposal";
import { Invoice } from "@/entities/Invoice";
import { Project } from "@/entities/Project";
import { format } from "date-fns";

export default function ClientDetails({ client, onClose, onEdit }) {
  const [proposals, setProposals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [client.id]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [proposalData, invoiceData, projectData] = await Promise.all([
        Proposal.filter({ client_id: client.id }),
        Invoice.filter({ client_id: client.id }),
        Project.filter({ client_id: client.id })
      ]);
      
      setProposals(proposalData);
      setInvoices(invoiceData);
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'prospect': 'bg-blue-100 text-blue-800'
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {client.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{client.name}</h2>
                <Badge className={statusColors[client.status]}>
                  {client.status}
                </Badge>
              </div>
            </DialogTitle>
            <Button variant="outline" onClick={() => onEdit(client)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.company && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{client.company}</p>
                  </div>
                </div>
              )}
              {client.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{client.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-lg font-bold text-green-600">
                      ${totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Proposals</p>
                    <p className="text-lg font-bold">{proposals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Invoices</p>
                    <p className="text-lg font-bold">{invoices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FolderKanban className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500">Projects</p>
                    <p className="text-lg font-bold">{projects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="proposals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="proposals" className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{proposal.title}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(proposal.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${proposal.total_amount?.toLocaleString()}</p>
                        <Badge variant="outline">{proposal.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {proposals.length === 0 && (
                <p className="text-center text-gray-500 py-8">No proposals yet</p>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{invoice.title}</h4>
                        <p className="text-sm text-gray-500">
                          {invoice.invoice_number} • {format(new Date(invoice.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${invoice.total_amount?.toLocaleString()}</p>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {invoices.length === 0 && (
                <p className="text-center text-gray-500 py-8">No invoices yet</p>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(project.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{project.progress}% Complete</p>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {projects.length === 0 && (
                <p className="text-center text-gray-500 py-8">No projects yet</p>
              )}
            </TabsContent>
          </Tabs>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}