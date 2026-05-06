import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { HelpCircle, Mail, MessageSquare, Phone } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your account and find answers to common questions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Find answers to the most common questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How do I manage identities?</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to the Identities section to view, create, and manage user identities.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">How do I track assets?</h4>
              <p className="text-sm text-muted-foreground">
                Use the Assets section to monitor and manage your organization's assets.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">How do I update my profile?</h4>
              <p className="text-sm text-muted-foreground">
                Go to Settings to update your personal information and preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Need more help? Get in touch with our support team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="What do you need help with?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Describe your issue or question..." rows={4} />
            </div>
            <Button className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
          <CardDescription>Choose the contact method that works best for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@capverra.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">1-800-CAPVERRA</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
