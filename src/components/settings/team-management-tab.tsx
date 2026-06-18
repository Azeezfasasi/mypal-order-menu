

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL, ENDPOINTS } from "@/services/api/endpoints";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2Icon, Loader2, Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Image from "next/image";

// Zod schemas
const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  roleId: z.string().min(1, "Role is required"),
  forcePasswordChange: z.boolean().default(false),
});

const editTeamMemberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
});

type InviteFormValues = z.infer<typeof inviteTeamMemberSchema>;
type EditFormValues = z.infer<typeof editTeamMemberSchema>;

interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

interface Role {
  id: string;
  name: string;
  business_id: string;
  is_default: boolean;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  tag: string;
  description: string;
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

export default function TeamManagementTab() {
  const { user: currentBusiness } = useAuth();
  const accessToken = currentBusiness?.current_token;

  // State management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      roleId: "",
      forcePasswordChange: false,
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editTeamMemberSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      roleId: "",
    },
  });

  // API calls
  const fetchTeamMembers = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoadingMembers(true);
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.GET_MEMBERS}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch team members");
      const data = await response.json();
      setTeamMembers(data.data?.items || []);
    } catch (error) {
      toast.error("Failed to load team members");
      console.error(error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [accessToken]);

  const fetchRoles = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoadingRoles(true);
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.GET_ROLES}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      toast.error("Failed to load roles");
      console.error(error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [accessToken]);

  // Load data on mount
  useEffect(() => {
    fetchTeamMembers();
    fetchRoles();
  }, [fetchTeamMembers, fetchRoles]);

  // Handle invite team member
  const handleInviteSubmit = async (values: InviteFormValues) => {
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      const payload = {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        roleId: values.roleId,
        forcePasswordChange: values.forcePasswordChange,
      };

      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.INVITE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to invite team member");
      }

      toast.success("Team member invitation sent successfully");
      inviteForm.reset();
      setIsInviteModalOpen(false);
      fetchTeamMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to invite team member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit team member
  const handleEditSubmit = async (values: EditFormValues) => {
    if (!accessToken || !selectedMember) return;
    try {
      setIsSubmitting(true);
      const payload = { roleId: values.roleId };

      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.UPDATE_MEMBER_ROLE(selectedMember.id)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update team member");
      }

      toast.success("Team member updated successfully");
      editForm.reset();
      setIsEditModalOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update team member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete team member
  const handleDeleteMember = async (memberId: string) => {
    if (!accessToken) return;
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.DELETE_MEMBER(memberId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete team member");
      }

      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team member"
      );
    }
  };

  // Handle edit member click
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    editForm.reset({
      email: member.email,
      first_name: member.first_name,
      last_name: member.last_name,
      roleId: member.role.id,
    });
    setIsEditModalOpen(true);
  };

  if (isLoadingMembers || isLoadingRoles) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasMembers = teamMembers.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex md:flex-col md:gap-4 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Button
          onClick={() => {
            inviteForm.reset();
            setIsInviteModalOpen(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Team member
        </Button>
      </div>

      {/* Team Members Table or Empty State */}
      {hasMembers ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-semibold">
                          {getInitials(member.first_name, member.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{member.role.name}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-12 md:p-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <Image src="/images/teamicon.svg" alt="No team members" width={64} height={64} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            You&apos;ve not added any Team member yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your team members will show here when you add them. Get your team
            added.
          </p>
          <Button
            onClick={() => {
              inviteForm.reset();
              setIsInviteModalOpen(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Team member
          </Button>
        </div>
      )}

      {/* Add Team Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(handleInviteSubmit)}
              className="space-y-4"
            >
              {/* Member name */}
              <FormField
                control={inviteForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your team member's name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member last name */}
              <FormField
                control={inviteForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter last name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member email */}
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your team member's mail address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={inviteForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Force password change toggle */}
              <FormField
                control={inviteForm.control}
                name="forcePasswordChange"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="cursor-pointer">
                      Force staff member to change password
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    inviteForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team member details</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              {/* Member name */}
              <FormField
                control={editForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your team member's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member last name */}
              <FormField
                control={editForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member email */}
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your team member's mail address"
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={editForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedMember(null);
                    editForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
